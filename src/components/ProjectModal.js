import React from 'react';

const ProjectModal = ({ showModal, modalProject, modalShavedText, onCloseModal }) => {
  if (!showModal || !modalProject) return null;

  return (
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
                onClick={onCloseModal}
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <div className="txt">
                {modalShavedText ? (
                  <span className="shaved">{modalShavedText}<br /><br /></span>
                ) : null}
                {modalProject?.acf?.modal && (
                  <div dangerouslySetInnerHTML={{ __html: modalProject.acf.modal }} />
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-primary"
                onClick={onCloseModal}
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProjectModal;