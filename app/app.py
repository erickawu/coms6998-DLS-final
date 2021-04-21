from CLIP import clip
from PIL import Image
import numpy as np
import torch
import os
import io

from flask import Flask, render_template, request, json, jsonify, abort
from urllib.request import urlopen
from uuid import uuid4

app = Flask(__name__, static_url_path='', static_folder='static/')
IMG_ROOT = os.path.join(os.path.dirname(app.instance_path), 'images')
MODEL_SAVE = os.path.join(os.path.dirname(app.instance_path), 'model', 'retrained_CLIP')
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print('loading model ...')
model_trained, transform = clip.load(MODEL_SAVE, device=DEVICE, jit=False)
print('model loaded!')
class_names = []
with open(os.path.join(
    os.path.dirname(app.instance_path),
    'model_resources',
    'DataUtils',
    '100categories.txt')
    ) as f:
    class_names = f.read().splitlines()
target_names = ["a sketch of a " + cls for cls in class_names]
class_text_tokens = clip.tokenize(target_names).to(DEVICE)
print('labels: ', target_names)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/eval', methods=['POST'])
def eval():
    data_uri = request.json.get('dataURI')
    if not data_uri:
        abort(403)
    image_filename = f'{uuid4()}.png'
    with urlopen(data_uri) as response, open(os.path.join(IMG_ROOT, image_filename), 'wb') as image_file:
        data = response.read()
        
        # save the image
        image_file.write(data)
        
        images_bytes = io.BytesIO(data)
        res = model_eval(images_bytes)
        return jsonify(res)

    return jsonify({'failed': data_uri})


def argmax(iterable):
    return max(enumerate(iterable), key=lambda x: x[1])[0]


def model_eval(image_bytes):
    pred = None
    pil_im = Image.open(image_bytes)
    image = transform(pil_im).unsqueeze(0).to(DEVICE)
    with torch.no_grad():
        logits_per_image, logits_per_text = model_trained(image, class_text_tokens)
        probs = logits_per_image.softmax(dim=-1).cpu().numpy()
        # make prediction
        pred = class_names[argmax(list(probs)[0])]
        print('predicted', pred)

    return {'prediction': pred}
