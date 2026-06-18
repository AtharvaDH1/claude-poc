import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'http://localhost:8080',
  realm: 'life-claims',
  clientId: 'life-claims-frontend',
});

export default keycloak;
