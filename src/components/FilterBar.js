import React from 'react';

const FilterBar = ({ activeFilter, onFilterClick }) => {
  return (
    <div className="margin-center">
      <div className="filter-header">Filtruj po systemie:</div>
      <div className="filter-container">        
        <div 
          className={`filter reset ${activeFilter === 'reset' ? 'active' : (activeFilter !== 'reset' ? '' : 'start-active')}`}
          data-filter="reset"
          data-bs-toggle="tooltip"
          data-bs-title="RESETUJ/POKAŻ WSZYSTKIE"
          data-bs-placement="top"
          onClick={() => onFilterClick('reset')}
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
          onClick={() => onFilterClick('modx')}
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
          onClick={() => onFilterClick('sat')}
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
          onClick={() => onFilterClick('ps')}
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
          onClick={() => onFilterClick('wp')}
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
          onClick={() => onFilterClick('dogo')}
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
  );
};

export default FilterBar;