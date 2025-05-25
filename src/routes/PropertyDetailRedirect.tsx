
import React from 'react';
import { Navigate } from 'react-router-dom';

export function PropertyDetailRedirect() {
  const searchParams = new URLSearchParams(window.location.search);
  const id = searchParams.get('id');
  
  if (id) {
    return <Navigate to={`/properties/${id}`} replace />;
  }
  
  return <Navigate to="/properties" replace />;
}
