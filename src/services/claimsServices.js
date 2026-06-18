const getToken = () => localStorage.getItem('token');

export const getClaimByUsername = async (username) => {
  const response = await fetch(`http://localhost:3001/api/claims/claimByUserName/${username}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
  });
  if (!response.ok) return [];
  const data = await response.json();
  return data;
};

export const assignClaim = async (claims, username) => {
  const response = await fetch('http://localhost:3001/api/claims/assignClaim', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ claims, username }),
  });
  if (!response.ok) return null;
  return response.json();
};

const claimsService = { getClaimByUsername, assignClaim };
export default claimsService;
