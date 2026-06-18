import ApiWrapper from '../util/ApiWrapper';

export const getRoles = () => ApiWrapper.fetchWithToken('role/getroles');
export const addRoles = (newRole) =>
  ApiWrapper.fetchWithToken('role/addrole', { method: 'POST', body: JSON.stringify(newRole) });

const roleService = { getRoles, addRoles };
export default roleService;
