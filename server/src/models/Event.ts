import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/sequelize';

class Event extends Model {}

Event.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    calendarId: { type: DataTypes.STRING },
    title: { type: DataTypes.STRING },
    body: { type: DataTypes.TEXT },
    isAllday: { type: DataTypes.BOOLEAN, defaultValue: false },
    start: { type: DataTypes.DATE },
    end: { type: DataTypes.DATE },
    category: { type: DataTypes.STRING },
    location: { type: DataTypes.STRING },
    attendees: { type: DataTypes.JSON }, // 배열 저장
    state: { type: DataTypes.STRING }, // 'Busy' | 'Free'
    isReadOnly: { type: DataTypes.BOOLEAN },
    color: { type: DataTypes.STRING },
    backgroundColor: { type: DataTypes.STRING },
    dragBackgroundColor: { type: DataTypes.STRING },
    borderColor: { type: DataTypes.STRING },
    customStyle: { type: DataTypes.JSON },
  },
  {
    sequelize,
    modelName: 'Event',
    tableName: 'Events',
  }
);

export default Event;
