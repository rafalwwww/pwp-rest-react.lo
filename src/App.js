import React, { Component } from 'react';
import { equalHeight, loadJSON, gridItemShave, registerColorboxHandlers } from './utils.js';

import { testProject, testProject1 } from './projectTestData';
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

class App extends Component {
  constructor() {
    super();
    this.state = {
      projects: [],
      // projects: [testProject,testProject1], // for testing purposes
      showModal: false,
      modalProject: null,
      shavedTextByProjectId: {},
      modalShavedText: '',
      lightboxOpen: false,
      lightboxIndex: 0,
      activeFilter: 'reset',
      filteredProjects: [],
      isLoading: true,  // Zmieniamy domyślną wartość na true
      portfolioHtml: '', // <-- dodane pole stanu dla section#portfolio
      siteName: '',
    };
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleWindowResize);
    window.addEventListener('focus', this.handleWindowResize);
    
    this.loadSiteInfo(); // pobierz nazwę strony z zmiennej WP
    this.loadPortfolioSection(269);    
    // for testing purposes
    this.loadAllProjects().then(() => {
      // Add test project to the beginning of the list only for testing purposes
      // but avoid duplicating projects with the same id
      this.setState((prev) => {
        const prevProjects = prev.projects || [];
        const existingIds = new Set(prevProjects.map(p => p && p.id));
        const toAdd = [];
        if (testProject && !existingIds.has(testProject.id)) toAdd.push(testProject);
        if (testProject1 && !existingIds.has(testProject1.id)) toAdd.push(testProject1);
        if (toAdd.length === 0) return null;
        return { projects: [...toAdd, ...prevProjects] };
      }, this.recalculateShaves);
    });    
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowResize);
    window.removeEventListener('focus', this.handleWindowResize);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.projects !== this.state.projects) {
      equalHeight();
      // gridItemShave();
      registerColorboxHandlers();
      
      // Ustaw początkowe przefiltrowane projekty (wszystkie)
      this.setState({
        filteredProjects: this.state.projects
      });
    }
    
    // Jeśli zmienił się filtr, zaktualizuj wyświetlanie
    if (prevState.activeFilter !== this.state.activeFilter || 
        prevState.filteredProjects !== this.state.filteredProjects) {
      setTimeout(() => {
        equalHeight();
        gridItemShave();
        registerColorboxHandlers();
      }, 0);
    }

  }

  handleWindowResize = () => {
    this.recalculateShaves();
    equalHeight();
  }
  // debounce/throttle for performance (only if resize is called too frequently when resizing the window). en:
  // handleWindowResize = (() => {
  //   let resizeTO;
  //   return () => {
  //     clearTimeout(resizeTO);
  //     resizeTO = setTimeout(() => {
  //       gridItemShave();
  //     }, 150);
  //   }
  // })();

  // Pobierz info o stronie z /wp-json/
  loadSiteInfo = async () => {
    try {
      // <-- używamy root: true aby loadJSON wywołał https://.../wp-json/
      const res = await loadJSON('', { root: true, silentHTTP: true });
      // if remote returned an HTTP error and silentHTTP is enabled, res.ok will be false
      if (res && res.ok === false) {
        // try local backup instead of throwing
        try {
          const backup = await fetch('/backup/wp-json.json').then(r => r.ok ? r.json() : null);
          if (backup && backup.name) {
            this.setState({ siteName: backup.name });
            return;
          }
        } catch (e) {
          // ignore local backup errors
        }
        // if no local backup, just silently continue with empty siteName
        return;
      }
      const data = res && res.data ? res.data : res;
      this.setState({ siteName: data.name || '' });
    } catch (err) {
      // If this was an HTTP error with metadata, log a short warning instead of a full stack
      if (err && err.status) {
        console.warn(`[loadSiteInfo] remote ${err.status} ${err.statusText || ''} for ${err.url} — using local backup if available`);
      } else {
        console.error('Błąd pobierania site info:', err);
      }
      // opcjonalny fallback: jeśli masz lokalny backup, ustaw go tu
      try {
        const backup = await fetch('/backup/wp-json.json').then(r => r.ok ? r.json() : null);
        if (backup && backup.name) this.setState({ siteName: backup.name });
      } catch (e) {}
    }
  }

  loadPortfolioSection = async (pageId = 269) => {
    try {
      // używamy loadJSON tak jak inne load* w projekcie
  const res = await loadJSON(`pages/${pageId}`, { useCache: true, cacheTTL: 86400, retries: 2, timeout: 8000, silentHTTP: true });
      const data = res && res.data ? res.data : res;
      const acf = (data && data.acf) ? data.acf : {};
      const before = acf['read-more-text-before'] || '';
      const read = acf['read-more-text'] || '';
      const content = (data && data.content && data.content.rendered) ? data.content.rendered : '';
      this.setState({ portfolioHtml: `${before}${content}${read}` });
    } catch (err) {
      // If the remote request failed with a known HTTP status (e.g. 401/404),
      // log a short warning instead of the full error object to avoid noisy stacks in dev console.
      if (err && (err.status === 401 || err.status === 404)) {
        console.warn(`[loadPortfolioSection] remote ${err.status} ${err.statusText} for ${err.url} — using local backup`);
      } else {
        console.error('[loadPortfolioSection] remote failed, trying local backup', err);
      }
      // fallback do lokalnego pliku zapisane przez Ciebie w public/backup/pages-269.json
      try {
        const r = await fetch('/backup/pages-269.json');
        if (r.ok) {
          const data = await r.json();
          const acf = data.acf || {};
          const before = acf['read-more-text-before'] || '';
          const read = acf['read-more-text'] || '';
          const content = (data.content && data.content.rendered) ? data.content.rendered : '';
          this.setState({ portfolioHtml: `${before}${content}${read}` });
          return;
        }
      } catch (e) {
        console.error('[loadPortfolioSection] local backup failed', e);
      }
      // ostatecznie zostaw pustą sekcję lub tekst informujący
      this.setState({ portfolioHtml: '<div class="notice">Sekcja portfolio chwilowo niedostępna</div>' });
    }
  }

  loadAllProjects = async () => {
    const perPage = 100;
    let allProjects = [];
    this.setState({ isLoading: true });
    try {
      // first page with caching and retries
      const first = await loadJSON(`portfolio_project?_embed&per_page=${perPage}&page=1`, { useCache: true, cacheTTL: 86400, retries: 2, timeout: 8000, silentHTTP: true });
      // If remote responded with an HTTP error and silentHTTP is enabled, use local backup
      if (first && first.ok === false) {
        // fallback to local backup file (public/backup/portfolio_project.json)
        const resp = await fetch('/backup/portfolio_project.json');
        if (resp.ok) {
          const data = await resp.json();
          this.setState({ projects: Array.isArray(data) ? data : (data.data || []), isLoading: false });
          return;
        } else {
          // couldn't get local backup either
          console.warn('[loadAllProjects] remote unavailable and local backup not found');
          this.setState({ isLoading: false });
          return;
        }
      }
      allProjects = allProjects.concat(first.data || first);
      const totalPages = parseInt(first.totalPages, 10) || 1;

      if (totalPages > 1) {
        const promises = [];
        for (let page = 2; page <= totalPages; page++) {
          promises.push(loadJSON(`portfolio_project?_embed&per_page=${perPage}&page=${page}`, { useCache: true, cacheTTL: 86400, retries: 2, timeout: 8000, silentHTTP: true }));
        }
        const results = await Promise.all(promises);
        for (const res of results) {
          if (res && res.ok === false) {
            // one of the pages failed; prefer local backup instead of partial data
            try {
              const resp = await fetch('/backup/portfolio_project.json');
              if (resp.ok) {
                const data = await resp.json();
                this.setState({ projects: Array.isArray(data) ? data : (data.data || []), isLoading: false });
                return;
              }
            } catch (e) {
              console.warn('[loadAllProjects] partial remote failure and local backup fetch failed', e);
            }
            console.warn('[loadAllProjects] some remote pages failed, aborting and using backup if available');
            this.setState({ isLoading: false });
            return;
          }
          allProjects = allProjects.concat((res && res.data) ? res.data : res);
        }
      }

      this.setState({ 
        projects: allProjects,
        isLoading: false
      });
    } catch (err) {
      console.error('[loadAllProjects] remote fetch failed, trying local backup:', err);
      // Fallback to local backup file (public/backup/portfolio_project.json)
      try {
        const resp = await fetch('/backup/portfolio_project.json');
        if (resp.ok) {
          const data = await resp.json();
          // assume backup contains an array of projects
          this.setState({ projects: Array.isArray(data) ? data : (data.data || []), isLoading: false });
          return;
        }
      } catch (e) {
        console.error('[loadAllProjects] local backup failed:', e);
      }

      this.setState({ isLoading: false });
    }
  }

  loadProjectById = async (id) => {
    try {
      const result = await loadJSON(`portfolio_project/${id}?_embed`, { silentHTTP: true });
      if (result && result.ok === false) {
        console.warn(`[loadProjectById] remote ${result.status} ${result.statusText} for ${result.url}`);
        return;
      }
      this.setState({ projects: [result.data] });
    } catch (err) {
      console.error('Błąd pobierania projektu:', err);
    }
  }

  // This code implements a double requestAnimationFrame pattern to defer execution until the next frame, ensuring DOM measurements are accurate. It calls gridItemShave to process text truncation for grid items, then updates component state with shaved text mapped by project ID, avoiding unnecessary re-renders when text hasn't changed.
  recalculateShaves = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        gridItemShave((projectId, shavedText) => {
          this.setState(prev => {
            const prevMap = prev.shavedTextByProjectId || {};
            if (prevMap[projectId] !== shavedText) {
              return { shavedTextByProjectId: { ...prevMap, [projectId]: shavedText } };
            }
            return null;
          });
        });
      });
    });
  }

  handleShowModal = (project) => {
    const gridItemEl = document.getElementById(`id${project.id}`);
    const hidden = gridItemEl ? gridItemEl.querySelector('.desc span.js-shave') : null;
    const over = hidden ? hidden.textContent || '' : '';
    const shavedForModal = over ? ('[...]' + over.replace('[...]', '')) : '';
    this.setState({ showModal: true, modalProject: project, modalShavedText: shavedForModal });
  }

  handleCloseModal = () => {
    this.setState({ showModal: false, modalProject: null });
  }

  openLightbox = (index = 0) => {
    this.setState({
      lightboxOpen: true,
      lightboxIndex: index
    });
  };

  closeLightbox = () => {
    this.setState({
      lightboxOpen: false
    });
  };

  // Nowa funkcja do obsługi filtrowania
  handleFilterClick = (filterClass) => {
    // Jeśli kliknięto reset
    if (filterClass === 'reset') {
      this.setState({
        activeFilter: 'reset',
        filteredProjects: this.state.projects
      });
      return;
    }
    
    // Jeśli kliknięto aktywny filtr (inny niż reset)
    if (this.state.activeFilter === filterClass) {
      this.setState({
        activeFilter: 'reset',
        filteredProjects: this.state.projects
      });
      return;
    }

    // W przeciwnym przypadku aktywujemy wybrany filtr
    // Filtrowanie projektów
    const filteredProjects = this.state.projects.filter(project => {
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

    this.setState({
      activeFilter: filterClass,
      filteredProjects: filteredProjects
    });
  };  

  // Komponent do wyświetlania licznika projektów
  ProjectCounter = ({ className }) => {
    const { projects } = this.state;
    const totalProjects = projects.length;
    const filteredCount = this.state.filteredProjects.length;
    
    return (
      <div className={`results-text ${className}`} aria-live="polite" aria-atomic="true">
        Projektów: <span className="alm-results-post_count">{filteredCount}</span>/
        <span className="alm-results-total_posts">{totalProjects}</span>
      </div>
    );
  };


    
  render() {
    const { projects, filteredProjects, activeFilter, lightboxOpen, lightboxIndex } = this.state;
    const ProjectCounter = this.ProjectCounter;
    const siteUrl = window.location.origin;
    
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

    return (
      <div className="App">
        <h1 className="wp-block-site-title">
          <a href={siteUrl} target="_self" rel="home" aria-current="page">{this.state.siteName}</a>
        </h1>
        <section id="portfolio" dangerouslySetInnerHTML={{ __html: this.state.portfolioHtml }}></section>

        {/* Sekcja filtrów */}
        {/* <button 
          className="btn btn-primary filters-btn" 
          type="button" 
          data-bs-toggle="tooltip" 
          data-bs-title="kliknij i wybierz system" 
          data-bs-placement="right"
        >
          <i className="bi bi-filter-circle"></i>FILTRUJ
        </button> */}

        {!this.state.isLoading && (
          <div className="margin-center">
            <div className="filter-header">Filtruj po systemie:</div>
            <div className="filter-container">        
              <div 
                className={`filter reset ${activeFilter === 'reset' ? 'active' : (activeFilter !== 'reset' ? '' : 'start-active')}`}
                data-filter="reset"
                data-bs-toggle="tooltip"
                data-bs-title="RESETUJ/POKAŻ WSZYSTKIE"
                data-bs-placement="top"
                onClick={() => this.handleFilterClick('reset')}
              >
                <div>
                  <img 
                    src="assets/css/images/reset.png" 
                    width="46" 
                    alt="" 
                    className="ico"
                  />
                </div>
              </div>
              <div 
                className={`filter modx ${activeFilter === 'modx' ? 'active' : ''}`}
                data-filter="modx"
                data-bs-toggle="tooltip"
                data-bs-title="Aktywuj/Dezaktywuj MODX"
                data-bs-placement="top"
                onClick={() => this.handleFilterClick('modx')}
              >
                <div>
                  <img 
                    src="assets/css/images/modx-ico.svg" 
                    width="46" 
                    alt="" 
                    className="ico"
                  />
                </div>
              </div>
              <div 
                className={`filter sat ${activeFilter === 'sat' ? 'active' : ''}`}
                data-filter="sat"
                data-bs-toggle="tooltip"
                data-bs-title="Aktywuj/Dezaktywuj Satelitka - możliwie jak najprostsza strona, czyli prezentacja konkretnego produktu bez CMS, głównie HTML, CSS, mniej PHP i JS"
                data-bs-placement="top"
                onClick={() => this.handleFilterClick('sat')}
              >
                <div>
                  <img 
                    src="assets/css/images/satelitka.png" 
                    width="46" 
                    alt="" 
                    className="ico"
                  />
                </div>
              </div>
              <div 
                className={`filter ps ${activeFilter === 'ps' ? 'active' : ''}`}
                data-filter="ps"
                data-bs-toggle="tooltip"
                data-bs-title="Aktywuj/Dezaktywuj PrestaShop"
                data-bs-placement="top"
                onClick={() => this.handleFilterClick('ps')}
              >
                <div>
                  <img 
                    src="assets/css/images/prestashop-ico.svg" 
                    width="46" 
                    alt="" 
                    className="ico"
                  />
                </div>
              </div>
              <div 
                className={`filter wp ${activeFilter === 'wp' ? 'active' : ''}`}
                data-filter="wp"
                data-bs-toggle="tooltip"
                data-bs-title="Aktywuj/Dezaktywuj WordPress"
                data-bs-placement="top"
                onClick={() => this.handleFilterClick('wp')}
              >
                <div>
                  <img 
                    src="assets/css/images/wordpress-ico.svg" 
                    width="46" 
                    alt="" 
                    className="ico"
                  />
                </div>
              </div>
              <div 
                className={`filter dogo ${activeFilter === 'dogo' ? 'active' : ''}`}
                data-filter="dogo"
                data-bs-toggle="tooltip"
                data-bs-title="Aktywuj/Dezaktywuj DOGO - jeden z systemów, po których nauczyłem się poruszać w trakcie pracy, wewnątrz-firmowy 'CMS' oparty o OOP PHP"
                data-bs-placement="top"
                onClick={() => this.handleFilterClick('dogo')}
              >
                <div>
                  <img 
                    src="assets/css/images/dogo-system-ico.webp" 
                    width="46" 
                    alt="" 
                    className="ico"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {!this.state.isLoading && (
          <div className="alm-results-text n1">
            <ProjectCounter className="n1" />
          </div>
        )}
        <div className="grid n1">
          {this.state.isLoading ? (
            <div className="loading-container">
              <p>Ładowanie projektów...</p>
            </div>
          ) : filteredProjects && filteredProjects.length > 0 ? filteredProjects.map((project, projectIndex) => {
          // {this.state.isLoading ? (<span></span>) : filteredProjects && filteredProjects.length > 0 ? filteredProjects.map((project, projectIndex) => {
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

                // className={`grid-item${(!imageUrl || imageUrl === 'default-image-url.jpg') ? ' no-img' : ''}${!project.content?.rendered ? ' no-hover-mobile' : ''}${hasModal ? ' isModal' : ''}${termSlugs ? ' ' + termSlugs : ''}`} 
                // for testing purposes, force hover!
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
                        onClick={() => this.handleShowModal(project)}
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
                        {/* <a
                          href={imageFull}
                          className="colorbox bimg"
                          title={project.acf?.altitle || ''}
                          rel={`colorbox-${project.id}`}
                        >
                          <i className="bi bi-card-image"></i>
                        </a> */}
                        <a
                          href="#"
                          className="lightbox bimg"
                          title={project.acf?.altitle || ''}
                          onClick={(e) => {
                            e.preventDefault();
                            if (galleryIndex !== -1) {
                              this.openLightbox(galleryIndex);
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
                    {/* <i className="bi bi-arrow-down-circle"></i> */}
                  </div>
                  {/* <div className="onclick"></div> */}
                  <div className="onclick" onClick={e => {
                    const gridItem = e.target.closest('.grid-item');
                    if (gridItem) gridItem.classList.toggle('hover');
                  }}></div>
                  {/* teraz wypiszemy test w console.log */}
                </article>

                {/* Modal został usunięty z mapowania! Jeden globalny modal poniżej. */}
              </div>

            );
          }) : <p>Brak projektów do wyświetlenia.</p>}

        </div>
        {!this.state.isLoading && (
          <div className="alm-results-text n2">
            <ProjectCounter className="n2" />
          </div>
        )}
      {/* Jeden globalny modal wyświetlany na końcu strony */}
        {this.state.showModal && this.state.modalProject && (
          <>
            <div className="modal-backdrop fade show"></div>
            <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h1 className="modal-title fs-5">Dodatkowe informacje</h1>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={this.handleCloseModal}
                      aria-label="Close"
                    ></button>
                  </div>
                  <div className="modal-body">
                    <div className="txt">
                      {this.state.modalShavedText ? (
                        <span className="shaved">{this.state.modalShavedText}<br /><br /></span>
                      ) : null}
                      {this.state.modalProject?.acf?.modal && (
                        <div dangerouslySetInnerHTML={{ __html: this.state.modalProject.acf.modal }} />
                      )}
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={this.handleCloseModal}
                    >
                      Zamknij
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Lightbox component - wspólna galeria dla wszystkich zdjęć */}
        {lightboxOpen && (
          <Lightbox
            open={lightboxOpen}
            index={lightboxIndex}
            slides={gallerySlides}
            close={this.closeLightbox}
          />
        )}
      </div>
    );
  }
}

export default App;
