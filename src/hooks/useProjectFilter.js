import { useState, useEffect } from 'react';

export const useProjectFilter = (projects) => {
  const [activeFilter, setActiveFilter] = useState('reset');
  const [filteredProjects, setFilteredProjects] = useState(projects);

  // New function to handle filtering
  const handleFilterClick = (filterClass) => {
    // If clicked reset
    if (filterClass === 'reset') {
      setActiveFilter('reset');
      setFilteredProjects(projects);
      return;
    }
    
    // If clicked the active filter (other than reset)
    if (activeFilter === filterClass) {
      setActiveFilter('reset');
      setFilteredProjects(projects);
      return;
    }

    // Otherwise, activate the selected filter
    // Filtering projects
    const filtered = projects.filter(project => {
      // Get slugs from wp:term
      let termSlugs = [];
      if (project._embedded && project._embedded['wp:term']) {
        termSlugs = project._embedded['wp:term']
          .flat()
          .map(term => term.slug)
          .filter(Boolean);
      }

      // Check if project matches filter criteria
      if (filterClass === 'ps' && (termSlugs.includes('p17') || termSlugs.includes('p16') || termSlugs.includes('ps'))) {
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