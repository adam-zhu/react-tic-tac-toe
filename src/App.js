import React, { Component } from 'react';
import './App.css';

const DEFAULT_DIMENSION = 3;
const DEFAULT_WIN_LENGTH = 3;

class App extends Component {
  state = {
    dimension: DEFAULT_DIMENSION,
    winLength: DEFAULT_WIN_LENGTH,
    moves: {}
    /*
      {
        [matrixRowIndex]: {
          [matrixColIndex]: 'x' || 'o'
        }
      }
    */
  };

  setDimension = e => {
    e.preventDefault();

    const elInput = e.target.querySelector('input');
    const dimension = Number(elInput.value);

    this.setState({ dimension, moves: {} });
  };

  setWinLength = e => {
    e.preventDefault();

    const elInput = e.target.querySelector('input');
    const winLength = Number(elInput.value);

    this.setState({ winLength, moves: {} });
  };

  handleMove = ({ xCoord, yCoord }) => e => {
    const { moves } = this.state;
    const moveValue = countMoves(moves) % 2 === 0
      ? 'x'
      : 'o';
    const updatedMoves = typeof moves[xCoord] === "undefined"
      ? {
        ...moves,
        [xCoord]: {
          [yCoord]: moveValue
        }
      }
      : {
        ...moves,
        [xCoord]: {
          ...moves[xCoord],
          [yCoord]: moveValue
        }
      };

    this.setState({ moves: updatedMoves });
  };

  handlePlayAgain = e => {
    e.preventDefault();

    this.setState({ moves: {} });
  }

  render() {
    const {
      dimension,
      winLength,
      moves
    } = this.state;
    const {
      setDimension,
      setWinLength,
      handleMove,
      handlePlayAgain
    } = this;

    return (
      <main>
        <form onSubmit={setWinLength}>
          <label>Win Length</label>
          <input type="text" name="winLength" defaultValue={winLength} />
          <button type="submit">Set Win Length</button>
        </form>
        <form onSubmit={setDimension}>
          <label>Grid Dimension</label>
          <input type="text" name="dimension" defaultValue={dimension} />
          <button type="submit">Set Dimension</button>
        </form>
        <Grid
          dimension={dimension}
          moves={moves}
          winLength={winLength}
          handleMove={handleMove}
          handlePlayAgain={handlePlayAgain}
        />
      </main>
    );
  }
};

export default App;

const Grid = ({ dimension, moves, winLength, handleMove, handlePlayAgain }) => {
  const dimensionArray = Array.from(Array(dimension).keys());
  const winningMoves = getWinningMoves({ dimension, moves, winLength });
  const tied = !winningMoves && countMoves(moves) === dimension * dimension;
  const gridMatrix = dimensionArray.map(xCoord =>
    dimensionArray.map(yCoord =>
      moves[xCoord] && moves[xCoord][yCoord]
        ? <td
          className={`cell ${winningMoves[xCoord] && winningMoves[xCoord][yCoord] ? "win" : ""}`}
          key={`${xCoord},${yCoord}`}
        >
          {moves[xCoord][yCoord]}
        </td>
        : <td
          className="cell"
          key={`${xCoord},${yCoord}`}
          onClick={!winningMoves && !tied ? handleMove({ xCoord, yCoord }) : () => { }}
        />
    )
  );

  return (
    <div className="grid-container">
      <table className={`grid ${tied ? "tied" : ""}`}>
        <tbody>
          {
            gridMatrix.map((row, i) => <tr className="row" key={i}>{row}</tr>)
          }
        </tbody>
      </table>
      {
        winningMoves
          ? <WinMessage winningMoves={winningMoves} playAgainHandler={handlePlayAgain} />
          : null
      }
      {
        tied
          ? <TiedMessage />
          : null
      }
    </div>
  );
};

const WinMessage = ({ winningMoves, playAgainHandler }) => {
  const winningRowKeys = Object.keys(winningMoves);
  const firstWinningRowKey = winningRowKeys[0];
  const firstWinningRow = winningMoves[firstWinningRowKey];
  const winningColKeys = Object.keys(firstWinningRow);
  const firstWinningColKey = winningColKeys[0];
  const firstWinningMove = winningMoves[firstWinningRowKey][firstWinningColKey];

  return (
    <div>
      <p>
        <strong>{firstWinningMove}</strong> wins.
      </p>
      <form className="play-again" onSubmit={playAgainHandler}>
        <button type="submit">Play Again</button>
      </form>
    </div>
  );
};

const TiedMessage = () =>
  <p>
    <strong>Draw.</strong>
  </p>;

const countMoves = moves =>
  Object.values(moves).reduce((ct, row) =>
    ct + Object.keys(row).length
    , 0);

const getWinningMoves = ({ dimension, moves, winLength }) =>
  getHorizontalWin({ moves, winLength }) ||
  getVerticalWin({ moves, winLength }) ||
  getDiagonalWin({ dimension, moves, winLength });

const getHorizontalWin = ({ moves, winLength }) => {
  const rowIndexes = Object.keys(moves).map(Number); // indexes of rows that have moves
  const rows = Object.values(moves); // Array of maps { [colIndex]: 'x' || 'o' }
  const rowsWithIndexes = rows.map((r, i) => ({ ...r, index: rowIndexes[i] }));

  return rowsWithIndexes.reduce((acc, row) => {
    const rowWinningSequence = rowWin({ row, winLength });

    if (rowWinningSequence) {
      // format back into original moves shape
      const mappedByColKey = rowWinningSequence.reduce((rAcc, colKey) => {
        const move = row[colKey];

        return {
          ...rAcc,
          [colKey]: move
        };
      }, {});

      return {
        [row.index]: mappedByColKey
      };
    }

    return acc;
  }, false);
};

const getVerticalWin = ({ moves, winLength }) => {
  const movesByCol = formatByColumn(moves);
  const colIndexes = Object.keys(movesByCol).map(Number);
  const cols = Object.values(movesByCol);
  const colsWithIndexes = cols.map((c, i) => ({ ...c, index: colIndexes[i] }));

  return colsWithIndexes.reduce((acc, col) => {
    const colWinningSequence = rowWin({ row: col, winLength });

    if (colWinningSequence) {
      // format back into original moves shape
      const formattedWinningSequence = Object.keys(moves)
        .map(Number)
        .filter(rowKey => colWinningSequence.indexOf(rowKey) !== -1)
        .reduce((cAcc, rowKey) => {
          const move = col[rowKey];

          return {
            ...cAcc,
            [rowKey]: {
              [col.index]: move
            }
          };
        }, {});

      return formattedWinningSequence;
    }

    return acc;
  }, false);
};

const formatByColumn = moves => {
  const rowKeys = Object.keys(moves).map(Number);
  const columnKeys = Object.values(moves).reduce((acc, col) =>
    acc.concat(Object.keys(col).map(Number))
    , []);
  const movesByColumn = Array.from(new Set(columnKeys))
    .sort((a, b) => a - b)
    .reduce((acc, colKey) => ({
      ...acc,
      [colKey]: rowKeys.reduce((rAcc, rowKey) => {
        const row = moves[rowKey];
        const move = row[colKey];

        if (typeof move !== "undefined") {
          return {
            ...rAcc,
            [rowKey]: move
          };
        }

        return rAcc;
      }, {})
    }), {});

  return movesByColumn;
};

const rowWin = ({ row, winLength }) => {
  const rowMovesByType = movesByType(row);

  const winningXSequence = getWinSequence(winLength)(rowMovesByType['x']);
  if (winningXSequence) {
    return winningXSequence;
  }

  const winningOSequence = getWinSequence(winLength)(rowMovesByType['o']);
  if (winningOSequence) {
    return winningOSequence;
  }

  return false;
};

const movesByType = row => Object.keys(row)
  .filter(k => k !== "index")
  .map(Number)
  .reduce((acc, columnIndex) => {
    const moveType = row[columnIndex];

    return {
      ...acc,
      [moveType]: acc[moveType].concat([columnIndex])
    };
  }, { x: [], o: [] });

const arrayEquals = (a, b) => {
  const aLen = a.length;

  if (aLen !== b.length) {
    return false;
  }

  for (let i = 0; i < aLen; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
};

const getWinSequence = winLength => arr => {
  return arr.reduce((acc, value, i) => {
    const nextLenSeq = arr.slice(i, i + winLength);
    const match = Array.from(Array(winLength).keys()).map(index => value + index);

    if (arrayEquals(nextLenSeq, match)) {
      return nextLenSeq;
    }

    return acc;
  }, false);
};

const getDiagonalWin = ({ dimension, moves, winLength }) => {
  // for each move that has been made, draw an "X" of diagonals w/ that move as the center
  // each diagonal extends winLength in each direction
  // check to see if there are winLength consecutive moves within that area
  const flatMoves = flattenMoves(moves); // [{ rowKey: 0, colKey: 1, move: 'x' || 'o' }]
  const winningMoveSequences = flatMoves.map(flatMove =>
    getDiagonalWinSequence({ dimension, flatMove, moves, winLength })
  ).filter(seq => seq !== null);

  if (winningMoveSequences.length > 0) {
    return winningMoveSequences[0];
  }

  return false;
};

const getDiagonalWinSequence = ({ dimension, flatMove, moves, winLength }) => {
  // create a winLength sequence starting from the move's row and col going south east
  // do the same except going north west
  // concat the two together and see if there are any winLength consecutive moves in the seq
  // repeat for north east / south west
  const originRowKey = flatMove.rowKey;
  const originColKey = flatMove.colKey;
  const moveType = flatMove.move; // 'x' || 'o'

  // getDiagonalSeq is a function that takes a direction and
  // returns a one dimensional array sequence representing winLength grid positions extending in that direction
  // [ { originRowKey: 0, originColKey: 1, move: 'x' || 'o' || null } ]
  const getDiagonalSeq = direction => {
    const getNextKeys = pos => {
      switch (direction) {
        case "southEast":
          return [originRowKey + pos, originColKey + pos];
        case "northWest":
          return [originRowKey - pos, originColKey - pos];
        case "northEast":
          return [originRowKey - pos, originColKey + pos];
        case "southWest":
          return [originRowKey + pos, originColKey - pos];
        default:
          return [null, null];
      }
    };
    const winLengthArray = Array.from(Array(winLength).keys()); // [ 0, 1, ... winLength-1 ]

    return winLengthArray.reduce((acc, pos) => {
      const [nextRowKey, nextColKey] = getNextKeys(pos);

      if (
        (0 <= nextRowKey && nextRowKey < dimension) &&
        (0 <= nextColKey && nextColKey < dimension)
      ) {
        const move = moves[nextRowKey] && moves[nextRowKey][nextColKey]
          ? moves[nextRowKey][nextColKey]
          : null;

        return acc.concat([{
          rowKey: nextRowKey,
          colKey: nextColKey,
          move
        }]);
      }

      return acc;
    }, []);
  };

  const getWinningSequence = flatMoveSequence => {
    // get a list of all consecutive segments in the sequence
    const moveSegments = flatMoveSequence.reduce((acc, fMove, i) => {
      if (fMove.move === moveType) {
        // if we haven't started accumulating sequences yet
        if (acc.length === 0) {
          return [[fMove]];
        }

        if (flatMoveSequence[i - 1].move === moveType) {
          // if we have accumulated sequences and the last move matches as well
          // then add this move to the last sequence that was accumulated
          const updatedAcc = acc.slice();

          updatedAcc[acc.length - 1] = acc[acc.length - 1].concat([fMove]);

          return updatedAcc;
        }

        return acc.concat([[fMove]]);
      }

      return acc;
    }, []);
    const winningSequences = moveSegments.filter(segment => segment.length >= winLength);

    if (winningSequences.length > 0) {
      const firstWinningSequence = winningSequences[0];

      return firstWinningSequence;
    }

    return null;
  };

  const southEastSeq = getDiagonalSeq("southEast");
  const northWestSeq = getDiagonalSeq("northWest");
  const northEastSeq = getDiagonalSeq("northEast");
  const southWestSeq = getDiagonalSeq("southWest");

  const northWestToSouthEastSeq = northWestSeq.reverse().concat(southEastSeq.slice(1, winLength));
  const southWestToNorthEastSeq = southWestSeq.reverse().concat(northEastSeq.slice(1, winLength));

  const wins = [
    getWinningSequence(northWestToSouthEastSeq),
    getWinningSequence(southWestToNorthEastSeq)
  ].filter(win => win !== null);

  if (wins.length > 0) {
    const win = wins[0];

    return unflattenMoves(win);
  }

  return null;
};

const flattenMoves = moves => {
  const rowKeys = Object.keys(moves).map(Number);

  return rowKeys.reduce((acc, rowKey) => {
    const row = moves[rowKey];
    const colKeys = Object.keys(row).map(Number);
    const colMoves = colKeys.reduce((cAcc, colKey) =>
      acc.concat({
        rowKey,
        colKey,
        move: row[colKey]
      })
      , []);

    return acc.concat(colMoves);
  }, []);
};

const unflattenMoves = flatMoves => flatMoves.reduce((acc, flatMove) => {
  const { rowKey, colKey, move } = flatMove;

  if (typeof acc[rowKey] === "undefined") {
    return {
      ...acc,
      [rowKey]: {
        [colKey]: move
      }
    };
  }

  return {
    ...acc,
    [rowKey]: {
      ...acc[rowKey],
      [colKey]: move
    }
  };
}, {});