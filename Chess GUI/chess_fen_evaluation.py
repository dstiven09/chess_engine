import chess
from stockfish import Stockfish
from decorators import timing_decorator
import concurrent.futures


def evaluate_move(stockfish_path, fen, move, depth):
    stockfish = Stockfish(path=stockfish_path)
    stockfish.set_depth(depth)

    board = chess.Board(fen)
    board.push(move)
    stockfish.set_fen_position(board.fen())
    evaluation = stockfish.get_evaluation()
    board.pop()

    if evaluation['type'] == 'cp':
        eval_value = evaluation['value'] / 100
    elif evaluation['type'] == 'mate':
        eval_value = 10000 if evaluation['value'] > 0 else -10000
        eval_value = eval_value / abs(evaluation['value'])

    return board.san(move), eval_value


@timing_decorator
def analyze_fen(fen, stockfish_path, top_n: int = 10, depth: int = 15):
    stockfish = Stockfish(path=stockfish_path)
    stockfish.set_depth(depth)

    stockfish.set_fen_position(fen)
    board = chess.Board(fen)

    move_evaluations = []

    with concurrent.futures.ThreadPoolExecutor() as executor:
        futures = [executor.submit(evaluate_move, stockfish_path, fen, move, depth) for move in board.legal_moves]
        for future in concurrent.futures.as_completed(futures):
            move_evaluations.append(future.result())

    is_black_turn = board.turn == chess.BLACK
    move_evaluations.sort(key=lambda x: x[1], reverse=not is_black_turn)

    top_moves = []
    for move, eval_value in move_evaluations[:top_n]:
        if abs(eval_value) == 10000:
            eval_str = f"Mate in {int(10000 / eval_value)}"
        else:
            eval_str = f"{eval_value:.2f}"
        top_moves.append(f"Move {move} - Evaluation: {eval_str}")

    return "\n".join(top_moves)
