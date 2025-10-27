import React from 'react';

const ProjectCounter = ({ projects, filteredProjects, className }) => {
  // const count = Array.isArray(projects) ? projects.length : 0;

  const totalProjects = Array.isArray(projects) ? projects.length : 0;  
  const filteredCount = Array.isArray(filteredProjects) ? filteredProjects.length : 0;

  // const totalProjects = projects.length;  
  // const filteredCount = filteredProjects.length;
  
  return (
    <div className={`results-text ${className}`} aria-live="polite" aria-atomic="true">
      Projektów: <span className="alm-results-post_count">{filteredCount}</span>/
      <span className="alm-results-total_posts">{totalProjects}</span>
    </div>
  );
};

export default ProjectCounter;