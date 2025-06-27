import eventRoutes from './event.routes';
import boardRoutes from './board.routes';
import commentRoutes from './comment.routes';

app.use('/api/events', eventRoutes);
router.use('/boards', boardRoutes);
app.use('/api/comments', commentRoutes);