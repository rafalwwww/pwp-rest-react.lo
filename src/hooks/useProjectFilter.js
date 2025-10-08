import { useState, useEffect } from 'react';

export const useProjectFilter = (projects) => {
  const [activeFilter, setActiveFilter] = useState('reset');
  const [filteredProjects, setFilteredProjects] = useState(projects);

  // Nowa funkcja do obsługi filtrowania
  const handleFilterClick = (filterClass) => {
    // Jeśli kliknięto reset
    if (filterClass === 'reset') {
      setActiveFilter('reset');
      setFilteredProjects(projects);
      return;
    }
    
    // Jeśli kliknięto aktywny filtr (inny niż reset)
    if (activeFilter === filterClass) {
      setActiveFilter('reset');
      setFilteredProjects(projects);
      return;
    }

    // W przeciwnym przypadku aktywujemy wybrany filtr
    // Filtrowanie projektów
    const filtered = projects.filter(project => {
      // Pobierz slugi z wp:term
      let termSlugs = [];
      if (project._embedded && project._embedded['wp:term']) {
        termSlugs = project._embedded['wp:term']
          .flat()
          .map(term => term.slug)
          .filter(Boolean);
      }

      // Sprawdź czy projekt spełnia kryteria filtra
      if (filterClass === 'ps' && (termSlugs.includes('p17') || termSlugs.includes('p16'))) {
        return true;
      } else if (termSlugs.includes(filterClass)) {
        return true;
      }
      
      return false;
    });

    setActiveFilter(filterClass);
    setFilteredProjects(filtered);
  };

  // Update filtered projects when projects change
  useEffect(() => {
    if (activeFilter === 'reset') {
      setFilteredProjects(projects);
    }
  }, [projects, activeFilter]);

  return {
    activeFilter,
    filteredProjects,
    handleFilterClick
  };
};