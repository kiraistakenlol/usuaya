from flask import Flask
import os

app = Flask(__name__)

@app.route('/')
def hello_world():
    return 'Hello from Flask App Runner AMD64 Test!\n'

if __name__ == "__main__":
    # App Runner provides the PORT environment variable
    port = int(os.environ.get('PORT', 8080))
    # Listen on 0.0.0.0 to be accessible from outside the container
    app.run(debug=False, host='0.0.0.0', port=port) 