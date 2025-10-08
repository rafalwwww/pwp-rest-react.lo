import React from 'react';

const ProjectCounter = ({ projects, filteredProjects, className }) => {
  const totalProjects = projects.length;
  const filteredCount = filteredProjects.length;
  
  return (
    <div className={`results-text ${className}`} aria-live="polite" aria-atomic="true">
      Projektów: <span className="alm-results-post_count">{filteredCount}</span>/
      <span className="alm-results-total_posts">{totalProjects}</span>
    </div>
  );
};

export default ProjectCounter;