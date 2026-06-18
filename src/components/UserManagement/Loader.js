import React from 'react';

const Loader = ({ message = 'Loading...' }) => (
  <div className="d-flex flex-column align-items-center justify-content-center p-4">
    <div className="spinner-border text-primary mb-2" role="status" />
    <p className="text-muted">{message}</p>
  </div>
);

export default Loader;
