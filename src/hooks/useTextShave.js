import { useState, useEffect, useCallback } from 'react';
import { gridItemShave } from '../utils.js';

export const useTextShave = () => {
  const [shavedTextByProjectId, setShavedTextByProjectId] = useState({});

  // This code implements a double requestAnimationFrame pattern to defer execution until the next frame, ensuring DOM measurements are accurate. It calls gridItemShave to process text truncation for grid items, then updates component state with shaved text mapped by project ID, avoiding unnecessary re-renders when text hasn't changed.
  const recalculateShaves = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        gridItemShave((projectId, shavedText) => {
          setShavedTextByProjectId(prev => {
            const prevMap = prev || {};
            if (prevMap[projectId] !== shavedText) {
              return { ...prevMap, [projectId]: shavedText };
            }
            return prev;
          });
        });
      });
    });
  }, []);

  useEffect(() => {
    recalculateShaves();
  }, [recalculateShaves]);

  return {
    shavedTextByProjectId,
    recalculateShaves
  };
};