# app.py
from flask import Flask, render_template
import os

app = Flask(__name__, instance_relative_config=True)
app.config.from_object('config.Config')

@app.route('/')
def home():
    # Ana sayfa: index.html şablonunu render et
    return render_template('index.html')

if __name__ == '__main__':
    # development için
    app.run(debug=True)
