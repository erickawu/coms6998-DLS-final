import os
from flask import Flask, render_template, request, json, jsonify, abort
from urllib.request import urlopen
from uuid import uuid4

app = Flask(__name__, static_url_path='', static_folder='static/')
IMG_ROOT = os.path.join(os.path.dirname(app.instance_path), 'images')


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/eval', methods=['POST'])
def eval():
    data_uri = request.json.get('dataURI')
    if not data_uri:
        abort(403)
    with urlopen(data_uri) as response, open(os.path.join(IMG_ROOT, f'{uuid4()}.png'), 'wb') as image_file:
        data = response.read()
        image_file.write(data)

    return jsonify({'test': data_uri})
