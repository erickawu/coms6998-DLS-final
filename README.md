# COMS6998 S21 Final Project

To download the QuickDraw data, clone the repository and run the following command while in the main repository folder `coms6998-DLS-final`:

```
python model_resources/DataUtils/prepare_data.py -c 100 -d 1 -show
```

to populate the folders `data` with 100 .npy files downloaded from Google Quickdraw and `dataset` with training and testsing files consisting of a total of 5000 samples (80-20 split) each from the 100 QuickDraw classes.

## Local Web Server

1. Make sure that `pipenv` is installed
2. Install dependencies by running `pipenv install`
3. Start the web server with `FLASK_APP=app/app.py DEBUG_MODE=1 pipenv run flask run` (you can also turn off debug mode if you want)
