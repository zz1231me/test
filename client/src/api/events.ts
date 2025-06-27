import api from '../api/axios';

export const createEvent = (event: any) => {
  return api.post('/events', event);
};

export const getEvents = (start: Date, end: Date) => {
  return api.get('/events', {
    params: {
      start: start.toISOString(),
      end: end.toISOString(),
    },
  }).then(res => res.data);
};


export const updateEvent = (id: number | string, event: any) => {
  return api.put(`/events/${id}`, event);
};

export const deleteEvent = (id: number | string) => {
  return api.delete(`/events/${id}`);
};
