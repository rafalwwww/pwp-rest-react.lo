import React from 'react';

const ProjectCard = ({ 
  project, 
  onShowModal, 
  onOpenLightbox, 
  gallerySlides,
  shavedTextByProjectId 
}) => {
  const featuredMedia = project._embedded && project._embedded['wp:featuredmedia'] && project._embedded['wp:featuredmedia'][0];
  const imageLarge = featuredMedia && featuredMedia.media_details && featuredMedia.media_details.sizes && featuredMedia.media_details.sizes.large ? featuredMedia.media_details.sizes.large.source_url : null;
  const imageFull = featuredMedia && featuredMedia.media_details && featuredMedia.media_details.sizes && featuredMedia.media_details.sizes.full ? featuredMedia.media_details.sizes.full.source_url : null;
  const imageUrl = imageLarge || imageFull;
  const hasModal = project.acf && project.acf.modal;
  const bgColor = project.acf && project.acf.bgColor ? { backgroundColor: project.acf.bgColor } : {};

  // Pobierz slugi z wp:term
  let termSlugs = '';
  if (project._embedded && project._embedded['wp:term']) {
    // wp:term to tablica tablic, więc spłaszczamy i bierzemy slugi
    termSlugs = project._embedded['wp:term']
      .flat()
      .map(term => term.slug)
      .filter(Boolean)
      .join(' ');
  }

  // Znajdź indeks tego zdjęcia w galerii
  let galleryIndex = -1;
  if (imageFull) {
    galleryIndex = gallerySlides.findIndex(slide => slide.src === imageFull);
  }

  return (
    <div
      key={project.id}
      id={`id${project.id}`}
      className={`grid-item${(!imageUrl || imageUrl === 'default-image-url.jpg') ? ' no-img' : ''}${!project.content?.rendered ? ' no-hover-mobile' : ''}${hasModal ? ' isModal' : ''}${termSlugs ? ' ' + termSlugs : ''} hover`}
      style={imageUrl && !bgColor.backgroundColor ? { backgroundImage: `url(${imageUrl})` } : bgColor}
    >
      <article className="content">
        <h2 dangerouslySetInnerHTML={{ __html: project.title.rendered }} />
        <div className="desc">
          {project.content?.rendered && (
            <div className="txt" dangerouslySetInnerHTML={{ __html: project.content.rendered }} />
          )}
          {hasModal && (
            <button
              type="button"
              className="modal-btn btn btn-primary"
              onClick={() => onShowModal(project)}
            >
              <a href="#" data-bs-toggle="tooltip" data-bs-title="Okno modalne = więcej informacji" data-bs-placement="right">
                WIĘCEJ
              </a>
            </button>
          )}
        </div>
        <div className="icons-action">
          {imageFull && (
            <>
              <a
                href="#"
                className="lightbox bimg"
                title={project.acf?.altitle || ''}
                onClick={(e) => {
                  e.preventDefault();
                  if (galleryIndex !== -1) {
                    onOpenLightbox(galleryIndex);
                  }
                }}
              >
                <i className="bi bi-card-image" style={{ marginLeft: '5px' }}></i>
              </a>
            </>
          )}
          {project.acf?.link && (
            <a
              href={project.acf.link}
              title={`Przejdź do ${project.acf?.altitle || ''}`}
              target="_blank"
              className="blink"
              rel="noopener noreferrer"
            >
              <i className="bi bi-link-45deg"></i>
            </a>
          )}
          {project.acf?.link_to_code && (
            <a
              href={project.acf.link_to_code}
              title={`Zobacz kod ${project.acf?.altitle || ''}`}
              target="_blank"
              className="blink code"
              rel="noopener noreferrer"
            >
              <i className="bi bi-file-earmark-code"></i>
            </a>
          )}
          {project.content?.rendered && <i className="bi bi-info-circle"></i>}
        </div>
        <div className="onclick" onClick={e => {
          const gridItem = e.target.closest('.grid-item');
          if (gridItem) gridItem.classList.toggle('hover');
        }}></div>
      </article>
    </div>
  );
};

export default ProjectCard;