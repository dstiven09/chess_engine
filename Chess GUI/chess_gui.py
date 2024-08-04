from flask import Flask, request, jsonify, render_template
from chess_fen_evaluation import analyze_fen
from config import STOCKFISH_PATH

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze_fen', methods=['POST'])
def analyze_fen_endpoint():
    data = request.get_json()
    fen = data['fen']
    depth = int(data['depth'])
    moves = int(data['moves'])
    result = analyze_fen(fen, STOCKFISH_PATH, top_n=moves, depth=depth)
    return jsonify({'result': result})

if __name__ == '__main__':
    app.run(debug=True)