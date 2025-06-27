import { RequestHandler } from 'express';
import { Op } from 'sequelize';
import Event from '../models/Event';

// 생성
export const createEvent: RequestHandler = async (req, res) => {
  try {
    const event = await Event.create(req.body);
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create event', error: err });
  }
};

// 조회 (기간 기반)
export const getEvents: RequestHandler = async (req, res) => {
  const { start, end } = req.query;

  try {
    const whereClause = start && end
      ? {
          start: { [Op.lte]: end },
          end: { [Op.gte]: start },
        }
      : {};

    const events = await Event.findAll({ where: whereClause });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch events', error: err });
  }
};

// 수정
export const updateEvent: RequestHandler = async (req, res) => {
  const { id } = req.params;
  try {
    const [updated] = await Event.update(req.body, { where: { id } });

    if (updated === 0) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    const updatedEvent = await Event.findByPk(id);
    res.json(updatedEvent);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update event', error: err });
  }
};

// 삭제
export const deleteEvent: RequestHandler = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Event.destroy({ where: { id } });

    if (deleted === 0) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    res.status(200).json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete event', error: err });
  }
};
