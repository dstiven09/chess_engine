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
    let enPassantTarget = null; // Track en passant target

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
                    if (pieceImages.hasOwnProperty(char)) { // Check if the character is a valid piece
                        const piece = document.createElement('div');
                        piece.classList.add('piece');
                        piece.setAttribute('draggable', 'true'); // Corrected line
                        piece.style.backgroundImage = `url(${pieceImages[char]})`;
                        piece.style.backgroundSize = 'contain';
                        piece.style.backgroundRepeat = 'no-repeat';
                        piece.style.width = '100%';
                        piece.style.height = '100%';
                        piece.setAttribute('data-piece', char);
                        squares[i * 8 + col].appendChild(piece);
                    } else {
                        console.error(`Invalid piece character: ${char}`);
                    }
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
            square.addEventListener('dragenter', dragEnter);
            square.addEventListener('dragleave', dragLeave);
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
        const fromIndex = parseInt(data[0]);
        const pieceData = data[1];
        const toIndex = parseInt(e.target.getAttribute('data-index') || e.target.parentElement.getAttribute('data-index'));

        if (!isNaN(toIndex)) {
            const fromSquare = document.querySelector(`.square[data-index='${fromIndex}']`);
            const toSquare = document.querySelector(`.square[data-index='${toIndex}']`);

            // Validate the move
            if (isValidMove(fromIndex, toIndex, pieceData)) {
                movePiece(fromSquare, toSquare, pieceData);

                // Update en passant target
                enPassantTarget = null;
                if (pieceData.toLowerCase() === 'p' && Math.abs(fromIndex - toIndex) === 16) {
                    enPassantTarget = (fromIndex + toIndex) / 2;
                }

                // Check for check or checkmate
                if (isInCheck(currentTurn)) {
                    console.log('Check!');
                    if (isCheckmate(currentTurn)) {
                        console.log('Checkmate!');
                        alert(`${currentTurn === 'w' ? 'Black' : 'White'} wins by checkmate!`);
                    }
                }

                // Switch turn
                currentTurn = currentTurn === 'w' ? 'b' : 'w';
            } else {
                console.log('Invalid move');
            }
            // Remove the highlight class after drop
            toSquare.classList.remove('highlight');
        }
    }

    function movePiece(fromSquare, toSquare, pieceData) {
        if (fromSquare && fromSquare.firstChild) {
            // Handle en passant capture
            if (pieceData.toLowerCase() === 'p' && toSquare.getAttribute('data-index') == enPassantTarget) {
                const capturedPawnIndex = parseInt(toSquare.getAttribute('data-index')) + (pieceData === 'P' ? 8 : -8);
                const capturedPawnSquare = document.querySelector(`.square[data-index='${capturedPawnIndex}']`);
                capturedPawnSquare.innerHTML = '';
            }

            toSquare.innerHTML = fromSquare.innerHTML;
            fromSquare.innerHTML = '';
            addDragAndDropHandlers();
            updateFEN();

            // Remove the highlight class after drop
            toSquare.classList.remove('highlight');
        }
    }

    function isValidMove(fromIndex, toIndex, piece) {
        const fromRow = Math.floor(fromIndex / 8);
        const fromCol = fromIndex % 8;
        const toRow = Math.floor(toIndex / 8);
        const toCol = toIndex % 8;

        const fromSquare = document.querySelector(`.square[data-index='${fromIndex}']`);
        const toSquare = document.querySelector(`.square[data-index='${toIndex}']`);
        const fromPiece = fromSquare && fromSquare.firstChild ? fromSquare.firstChild.getAttribute('data-piece') : null;
        const toPiece = toSquare && toSquare.firstChild ? toSquare.firstChild.getAttribute('data-piece') : null;

        console.log(`Validating move from ${fromIndex} (${fromRow}, ${fromCol}) to ${toIndex} (${toRow}, ${toCol}) for piece ${piece}`);

        // Ensure the destination is empty or contains an opponent's piece
        if (toPiece && isSameColor(fromPiece, toPiece)) {
            console.log('Invalid move: destination occupied by same color');
            return false;
        }

        // Pawn movement validation
        if (piece.toLowerCase() === 'p') {
            const direction = piece === 'P' ? -1 : 1; // White pawns move up, black pawns move down
            const startRow = piece === 'P' ? 6 : 1; // Starting row for white and black pawns

            // Moving forward
            if (toCol === fromCol) {
                // One square forward
                if (toRow === fromRow + direction && !toSquare.firstChild) {
                    console.log('Valid pawn move: one square forward');
                    return true;
                }
                // Two squares forward from the start position
                if (fromRow === startRow && toRow === fromRow + 2 * direction && !toSquare.firstChild &&
                    !document.querySelector(`.square[data-index='${fromIndex + direction * 8}']`).firstChild) {
                    console.log('Valid pawn move: two squares forward from start');
                    return true;
                }
            }
            // Capturing diagonally
            if (Math.abs(toCol - fromCol) === 1 && toRow === fromRow + direction && (toSquare.firstChild || toIndex === enPassantTarget)) {
                console.log('Valid pawn move: capturing diagonally');
                return true;
            }

            console.log('Invalid pawn move');
            return false;
        }

        // Knight movement validation
        if (piece.toLowerCase() === 'n') {
            const knightMoves = [
                [-2, -1], [-2, 1], [-1, -2], [-1, 2],
                [1, -2], [1, 2], [2, -1], [2, 1]
            ];
            const validMove = knightMoves.some(([dx, dy]) => {
                const newRow = fromRow + dx;
                const newCol = fromCol + dy;
                return newRow === toRow && newCol === toCol;
            });
            console.log(`Knight move ${validMove ? 'valid' : 'invalid'}`);
            return validMove;
        }

        // Bishop movement validation
        if (piece.toLowerCase() === 'b') {
            if (Math.abs(fromRow - toRow) === Math.abs(fromCol - toCol)) {
                return isPathClear(fromRow, fromCol, toRow, toCol);
            }
        }

        // Rook movement validation
        if (piece.toLowerCase() === 'r') {
            if (fromRow === toRow || fromCol === toCol) {
                return isPathClear(fromRow, fromCol, toRow, toCol);
            }
        }

        // Queen movement validation
        if (piece.toLowerCase() === 'q') {
            if (fromRow === toRow || fromCol === toCol || Math.abs(fromRow - toRow) === Math.abs(fromCol - toCol)) {
                return isPathClear(fromRow, fromCol, toRow, toCol);
            }
        }

        // King movement validation
        if (piece.toLowerCase() === 'k') {
            const kingMoves = [
                [-1, -1], [-1, 0], [-1, 1],
                [0, -1], [0, 1],
                [1, -1], [1, 0], [1, 1]
            ];
            const validMove = kingMoves.some(([dx, dy]) => {
                const newRow = fromRow + dx;
                const newCol = fromCol + dy;
                return newRow === toRow && newCol === toCol;
            });

            if (validMove) {
                // Ensure the king is not moving into check
                const originalToPiece = toSquare.innerHTML;
                toSquare.innerHTML = fromSquare.innerHTML;
                fromSquare.innerHTML = '';
                const inCheck = isInCheck(currentTurn);
                fromSquare.innerHTML = toSquare.innerHTML;
                toSquare.innerHTML = originalToPiece;

                return !inCheck;
            }
            return false;
        }

        console.log('Invalid move: piece movement not defined');
        return false;
    }

    function isPathClear(fromRow, fromCol, toRow, toCol) {
        const rowStep = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0;
        const colStep = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0;

        let row = fromRow + rowStep;
        let col = fromCol + colStep;

        while (row !== toRow || col !== toCol) {
            if (document.querySelector(`.square[data-index='${row * 8 + col}']`).firstChild) {
                return false;
            }
            row += rowStep;
            col += colStep;
        }

        return true;
    }

    function isSameColor(piece1, piece2) {
        if (!piece1 || !piece2) return false;
        return (piece1.toUpperCase() === piece1) === (piece2.toUpperCase() === piece2);
    }

    function isInCheck(turn) {
        const kingPiece = turn === 'w' ? 'K' : 'k';
        const kingSquare = [...document.querySelectorAll('.square')].find(square => square.firstChild && square.firstChild.getAttribute('data-piece') === kingPiece);
        if (!kingSquare) return false;
        const kingIndex = parseInt(kingSquare.getAttribute('data-index'));
        const opponentTurn = turn === 'w' ? 'b' : 'w';
        const opponentPieces = [...document.querySelectorAll('.piece')].filter(piece => piece.getAttribute('data-piece').toLowerCase() === piece.getAttribute('data-piece').toLowerCase() && (turn === 'w' ? piece.getAttribute('data-piece') === piece.getAttribute('data-piece').toLowerCase() : piece.getAttribute('data-piece') === piece.getAttribute('data-piece').toUpperCase()));

        return opponentPieces.some(piece => {
            const fromIndex = parseInt(piece.parentElement.getAttribute('data-index'));
            const pieceData = piece.getAttribute('data-piece');
            return isValidMove(fromIndex, kingIndex, pieceData);
        });
    }

    function isCheckmate(turn) {
        const pieces = [...document.querySelectorAll('.piece')].filter(piece => piece.getAttribute('data-piece').toLowerCase() === piece.getAttribute('data-piece').toLowerCase() && (turn === 'w' ? piece.getAttribute('data-piece') === piece.getAttribute('data-piece').toUpperCase() : piece.getAttribute('data-piece') === piece.getAttribute('data-piece').toLowerCase()));
        return !pieces.some(piece => {
            const fromIndex = parseInt(piece.parentElement.getAttribute('data-index'));
            for (let toIndex = 0; toIndex < 64; toIndex++) {
                if (isValidMove(fromIndex, toIndex, piece.getAttribute('data-piece'))) {
                    const fromSquare = document.querySelector(`.square[data-index='${fromIndex}']`);
                    const toSquare = document.querySelector(`.square[data-index='${toIndex}']`);
                    const originalToPiece = toSquare.innerHTML;
                    toSquare.innerHTML = fromSquare.innerHTML;
                    fromSquare.innerHTML = '';
                    const inCheck = isInCheck(turn);
                    fromSquare.innerHTML = toSquare.innerHTML;
                    toSquare.innerHTML = originalToPiece;

                    if (!inCheck) {
                        return true;
                    }
                }
            }
            return false;
        });
    }

    function dragEnter(e) {
        e.preventDefault();
        const square = e.currentTarget;
        square.classList.add('highlight');
    }

    function dragLeave(e) {
        const square = e.currentTarget;
        square.classList.remove('highlight');
    }

    function addClickHandlers() {
        const squares = document.querySelectorAll('.square');

        squares.forEach(square => {
            square.addEventListener('click', handleSquareClick);
        });
    }

    function handleSquareClick(e) {
        const square = e.currentTarget;
        const squareIndex = parseInt(square.getAttribute('data-index'));

        if (selectedSquare === null) {
            if (square.firstChild) {
                selectedSquare = square;
                square.classList.add('selected');
            }
        } else {
            const fromIndex = parseInt(selectedSquare.getAttribute('data-index'));
            const pieceData = selectedSquare.firstChild.getAttribute('data-piece');

            // Ensure selectedSquare and selectedSquare.firstChild are not null
            if (selectedSquare && selectedSquare.firstChild) {
                // Validate the move
                if (isValidMove(fromIndex, squareIndex, pieceData)) {
                    movePiece(selectedSquare, square, pieceData);

                    // Update en passant target
                    enPassantTarget = null;
                    if (pieceData.toLowerCase() === 'p' && Math.abs(fromIndex - squareIndex) === 16) {
                        enPassantTarget = (fromIndex + squareIndex) / 2;
                    }

                    // Check for check or checkmate
                    if (isInCheck(currentTurn)) {
                        console.log('Check!');
                        if (isCheckmate(currentTurn)) {
                            console.log('Checkmate!');
                            alert(`${currentTurn === 'w' ? 'Black' : 'White'} wins by checkmate!`);
                        }
                    }

                    // Switch turn
                    currentTurn = currentTurn === 'w' ? 'b' : 'w';
                } else {
                    console.log('Invalid move');
                }
            }

            selectedSquare.classList.remove('selected');
            selectedSquare = null;
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
        fen += ` ${turn} KQkq - 0 1`;
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