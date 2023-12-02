import React, { useState, useEffect, useCallback } from 'react';

const DetailCellRenderer = ({ data, eParentOfValue }) => {
  const firstRecord = data.callRecords[0];
  const [callId, setCallId] = useState(firstRecord.callId);
  const [number, setNumber] = useState(firstRecord.number);
  const [direction, setDirection] = useState(firstRecord.direction);

  const onParentElFocus = useCallback((event) => {
    const currentEl = event.target;
    const previousEl = event.relatedTarget;
    const previousRowEl = findRowForEl(previousEl);
    const currentRow = currentEl && parseInt(currentEl.getAttribute('row-index'), 10);
    const previousRow = previousRowEl && parseInt(previousRowEl.getAttribute('row-index'), 10);

    const inputs = Array.from(currentEl.querySelectorAll('input')).filter(el => {
      if (el.checkVisibility) {
          return el.checkVisibility({
              checkOpacity: true,
              checkVisibilityCSS: true
          });
      }
      return !!el.offsetParent && window.getComputedStyle(el).visibility === 'visible';
  });
  
    // Navigating forward, or unknown previous row
    if (!previousRow || currentRow >= previousRow) {
        // Focus on the first input
        inputs[0].focus();
    } else { // Navigating backwards
        // Focus on the last input
        inputs[inputs.length - 1].focus();
    }
  }, []);

  useEffect(() => {
    eParentOfValue.addEventListener('focus', onParentElFocus);

    return () => {
      eParentOfValue.removeEventListener('focus', onParentElFocus);
    }
  }, []);

  return <div>
    <form>
      <div>
        <p>
          <label>
            Call Id:<br />
            <input type="text" value={callId} onChange={e => setCallId(e.target.value)} />
          </label>
        </p>
        <p>
          <label>
            Number:<br />
            <input type="text" value={number} onChange={e => setNumber(e.target.value)} />
          </label>
        </p>
        <p>
          <label>
            Direction:<br />
            <input type="text" value={direction} onChange={e => setDirection(e.target.value)} />
          </label>
        </p>
      </div>
    </form>
  </div>;
};

function findRowForEl(el) {
  let rowEl = el;
  while (rowEl) {
      rowEl = rowEl.parentElement;
      if (rowEl && rowEl.getAttribute('role') === 'row') { return rowEl; }
  }

  return null;
}

export default DetailCellRenderer;