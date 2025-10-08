import React, { useState, useEffect } from 'react';
import { equalHeight, registerColorboxHandlers } from './utils.js';
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

// Import components
import ProjectCard from './components/ProjectCard';
import FilterBar from './components/FilterBar';
import ProjectModal from './components/ProjectModal';
import ProjectCounter from './components/ProjectCounter';

// Import hooks
import { useProjectData } from './hooks/useProjectData';
import { useProjectFilter } from './hooks/useProjectFilter';
import { useTextShave } from './hooks/useTextShave';

// Import services
import { loadPortfolioSection } from './services/portfolioService';

function App() {
  const [portfolioHtml, setPortfolioHtml] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalProject, setModalProject] = useState(null);
  const [modalShavedText, setModalShavedText] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Use custom hooks
  const { projects, isLoading, siteName, loadProjectById } = useProjectData();
  const { activeFilter, filteredProjects, handleFilterClick } = useProjectFilter(projects);
  const { shavedTextByProjectId, recalculateShaves } = useTextShave();

  const siteUrl = window.location.origin;

  useEffect(() => {
    window.addEventListener('resize', handleWindowResize);
    window.addEventListener('focus', handleWindowResize);
    
    loadPortfolioSection(269).then(html => setPortfolioHtml(html));

    return () => {
      window.removeEventListener('resize', handleWindowResize);
      window.removeEventListener('focus', handleWindowResize);
    };
  }, []);

  useEffect(() => {
    if (projects.length > 0) {
      equalHeight();
      registerColorboxHandlers();
    }
  }, [projects]);

  useEffect(() => {
    if (filteredProjects.length > 0) {
      setTimeout(() => {
        equalHeight();
        recalculateShaves();
        registerColorboxHandlers();
      }, 0);
    }
  }, [filteredProjects, activeFilter]);

  const handleWindowResize = () => {
    recalculateShaves();
    equalHeight();
  };

  // Tworzymy wspólną galerię dla wszystkich zdjęć
  const gallerySlides = filteredProjects
    .filter(project => {
      const featuredMedia = project._embedded && project._embedded['wp:featuredmedia'] && project._embedded['wp:featuredmedia'][0];
      const imageFull = featuredMedia && featuredMedia.media_details && featuredMedia.media_details.sizes && featuredMedia.media_details.sizes.full ? featuredMedia.media_details.sizes.full.source_url : null;
      return imageFull;
    })
    .map(project => {
      const featuredMedia = project._embedded && project._embedded['wp:featuredmedia'] && project._embedded['wp:featuredmedia'][0];
      const imageFull = featuredMedia.media_details.sizes.full.source_url;
      return {
        src: imageFull,
        alt: project.acf?.altitle || project.title?.rendered || ''
      };
    });

  const handleShowModal = (project) => {
    const gridItemEl = document.getElementById(`id${project.id}`);
    const hidden = gridItemEl ? gridItemEl.querySelector('.desc span.js-shave') : null;
    const over = hidden ? hidden.textContent || '' : '';
    const shavedForModal = over ? ('[...]' + over.replace('[...]', '')) : '';
    setModalProject(project);
    setModalShavedText(shavedForModal);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalProject(null);
  };

  const openLightbox = (index = 0) => {
    setLightboxOpen(true);
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  return (
    <div className="App">
      <h1 className="wp-block-site-title">
        <a href={siteUrl} target="_self" rel="home" aria-current="page">{siteName}</a>
      </h1>
      <section id="portfolio" dangerouslySetInnerHTML={{ __html: portfolioHtml }}></section>

      {!isLoading && (
        <>
          <FilterBar 
            activeFilter={activeFilter}
            onFilterClick={handleFilterClick}
          />
          <div className="alm-results-text n1">
            <ProjectCounter 
              projects={projects}
              filteredProjects={filteredProjects}
              className="n1"
            />
          </div>
        </>
      )}
      
      <div className="grid n1">
        {isLoading ? (
          <div className="loading-container">
            <p>Ładowanie projektów...</p>
          </div>
        ) : filteredProjects && filteredProjects.length > 0 ? filteredProjects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onShowModal={handleShowModal}
            onOpenLightbox={openLightbox}
            gallerySlides={gallerySlides}
            shavedTextByProjectId={shavedTextByProjectId}
          />
        )) : <p>Brak projektów do wyświetlenia.</p>}
      </div>
      
      {!isLoading && (
        <div className="alm-results-text n2">
          <ProjectCounter 
            projects={projects}
            filteredProjects={filteredProjects}
            className="n2"
          />
        </div>
      )}
      
      <ProjectModal 
        showModal={showModal}
        modalProject={modalProject}
        modalShavedText={modalShavedText}
        onCloseModal={handleCloseModal}
      />
      
      {/* Lightbox component - wspólna galeria dla wszystkich zdjęć */}
      {lightboxOpen && (
        <Lightbox
          open={lightboxOpen}
          index={lightboxIndex}
          slides={gallerySlides}
          close={closeLightbox}
        />
      )}
    </div>
  );
}

export default App;
