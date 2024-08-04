document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('chess-board');
    const fenForm = document.getElementById('fen-form');
    const fenInput = document.getElementById('fen-input');
    const turnSelect = document.getElementById('turn-select');
    const depthInput = document.getElementById('depth-input');
    const movesInput = document.getElementById('moves-input');
    const output = document.getElementById('output');

    let currentPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    let currentTurn = 'w';
    let selectedSquare = null;

    const pieceImages = {
        'r': 'static/images/black_rook.png', 'n': 'static/images/black_knight.png',
        'b': 'static/images/black_bishop.png', 'q': 'static/images/black_queen.png',
        'k': 'static/images/black_king.png', 'p': 'static/images/black_pawn.png',
        'R': 'static/images/white_rook.png', 'N': 'static/images/white_knight.png',
        'B': 'static/images/white_bishop.png', 'Q': 'static/images/white_queen.png',
        'K': 'static/images/white_king.png', 'P': 'static/images/white_pawn.png'
    };

    function createBoard() {
        for (let i = 0; i < 64; i++) {
            const square = document.createElement('div');
            square.classList.add('square');
            square.setAttribute('data-index', i);
            if (Math.floor(i / 8) % 2 === 0) {
                if (i % 2 === 0) {
                    square.style.backgroundColor = '#eeeed2';
                } else {
                    square.style.backgroundColor = '#769656';
                }
            } else {
                if (i % 2 === 0) {
                    square.style.backgroundColor = '#769656';
                } else {
                    square.style.backgroundColor = '#eeeed2';
                }
            }
            board.appendChild(square);
        }
    }

    function setPieces(fen) {
        console.log('Setting pieces for FEN:', fen);
        const rows = fen.split(' ')[0].split('/');
        const squares = board.getElementsByClassName('square');

        for (let square of squares) {
            square.textContent = '';
            square.removeAttribute('draggable');
            square.style.backgroundImage = '';
        }

        for (let i = 0; i < rows.length; i++) {
            let col = 0;
            for (let char of rows[i]) {
                if (isNaN(char)) {
                    const piece = document.createElement('div');
                    piece.classList.add('piece');
                    piece.setAttribute('draggable', true);
                    piece.style.backgroundImage = `url(${pieceImages[char]})`;
                    piece.style.backgroundSize = 'contain';
                    piece.style.backgroundRepeat = 'no-repeat';
                    piece.style.width = '100%';
                    piece.style.height = '100%';
                    squares[i * 8 + col].appendChild(piece);
                    col++;
                } else {
                    col += parseInt(char);
                }
            }
        }

        addDragAndDropHandlers();
        addClickHandlers();
    }

    function addDragAndDropHandlers() {
        const pieces = document.querySelectorAll('.piece');
        const squares = document.querySelectorAll('.square');

        pieces.forEach(piece => {
            piece.addEventListener('dragstart', dragStart);
        });

        squares.forEach(square => {
            square.addEventListener('dragover', dragOver);
            square.addEventListener('drop', drop);
        });
    }

    function dragStart(e) {
        const piece = e.target;
        const transparentImage = document.createElement('img');
        transparentImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
        e.dataTransfer.setDragImage(transparentImage, 0, 0);
        e.dataTransfer.effectAllowed = 'move';
        const parentIndex = piece.parentElement.getAttribute('data-index');
        const pieceData = piece.getAttribute('data-piece');
        e.dataTransfer.setData('text/plain', parentIndex ? `${parentIndex},${pieceData}` : `selection,${pieceData}`);
    }

    function dragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    function drop(e) {
        e.preventDefault();
        const data = e.dataTransfer.getData('text/plain').split(',');
        const fromIndex = data[0];
        const pieceData = data[1];
        const toIndex = e.target.getAttribute('data-index') || e.target.parentElement.getAttribute('data-index');

        if (toIndex !== null) {
            const toSquare = document.querySelector(`.square[data-index='${toIndex}']`);

            if (fromIndex === 'selection') {
                const piece = document.createElement('div');
                piece.classList.add('piece');
                piece.setAttribute('draggable', true);
                piece.setAttribute('data-piece', pieceData);
                piece.style.backgroundImage = `url(${pieceImages[pieceData]})`;
                piece.style.backgroundSize = 'contain';
                piece.style.backgroundRepeat = 'no-repeat';
                piece.style.width = '100%';
                piece.style.height = '100%';
                toSquare.innerHTML = '';
                toSquare.appendChild(piece);
            } else {
                const fromSquare = document.querySelector(`.square[data-index='${fromIndex}']`);
                if (fromSquare && fromSquare.firstChild) {
                    toSquare.innerHTML = fromSquare.innerHTML;
                    fromSquare.innerHTML = '';
                }
            }

            addDragAndDropHandlers();
            updateFEN();
        }
    }

    function addClickHandlers() {
        const squares = document.querySelectorAll('.square');

        squares.forEach(square => {
            square.addEventListener('click', handleSquareClick);
        });
    }

    function handleSquareClick(e) {
        const square = e.currentTarget;
        const squareIndex = square.getAttribute('data-index');

        if (selectedSquare === null) {
            if (square.firstChild) {
                selectedSquare = square;
                square.classList.add('selected');
            }
        } else {
            if (square !== selectedSquare) {
                square.innerHTML = selectedSquare.innerHTML;
                selectedSquare.innerHTML = '';
                selectedSquare.classList.remove('selected');
                selectedSquare = null;
                updateFEN();
            } else {
                selectedSquare.classList.remove('selected');
                selectedSquare = null;
            }
        }
    }

    function updateFEN() {
        const squares = board.getElementsByClassName('square');
        let fen = '';
        let emptyCount = 0;

        for (let i = 0; i < 64; i++) {
            const square = squares[i];
            if (!square.firstChild) {
                emptyCount++;
            } else {
                if (emptyCount > 0) {
                    fen += emptyCount;
                    emptyCount = 0;
                }
                const piece = square.firstChild.style.backgroundImage.split('/').pop().split('.')[0];
                const fenPiece = Object.keys(pieceImages).find(key => pieceImages[key].includes(piece));
                fen += fenPiece;
            }

            if ((i + 1) % 8 === 0) {
                if (emptyCount > 0) {
                    fen += emptyCount;
                    emptyCount = 0;
                }
                if (i < 63) {
                    fen += '/';
                }
            }
        }

        const turn = turnSelect.value;
        fen += ` ${turn} - - 0 1`;
        fenInput.value = fen;
        currentPosition = fen;
        currentTurn = turn;
    }

    fenForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const fen = fenInput.value;
        const depth = depthInput.value;
        const moves = movesInput.value;
        setPieces(fen); // Set the board to the entered FEN before fetching the evaluation
        fetch('/analyze_fen', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fen, depth, moves })
        })
        .then(response => response.json())
        .then(data => {
            output.textContent = data.result;
        })
        .catch(error => {
            console.error('Error:', error);
        });
    });

    // Event listener for turn selection to update FEN accordingly
    turnSelect.addEventListener('change', updateFEN);

    createBoard();
    setPieces(currentPosition);
    addDragAndDropHandlers();
});