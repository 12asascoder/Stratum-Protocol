import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import winston from 'winston';
import dotenv from 'dotenv';

dotenv.config();

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) =>
            `${timestamp} [${level}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`
        )
    ),
    transports: [new winston.transports.Console()],
});

// ===========================================================================
// KAFKA → WEBSOCKET BRIDGE
// ===========================================================================

const KAFKA_TOPICS = [
    'stratum.validated.events',
    'stratum.alerts.anomaly',
    'stratum.simulation.results',
    'stratum.ledger.decisions',
    'stratum.governance.rulings',
    'stratum.cyber.threats',
    'stratum.orchestration.actions',
];

interface StratumEvent {
    topic: string;
    partition: number;
    offset: string;
    timestamp: string;
    key: string | null;
    value: Record<string, unknown>;
}

class KafkaWebSocketBridge {
    private kafka: Kafka;
    private consumer: Consumer;
    private io: SocketIOServer;

    constructor(io: SocketIOServer) {
        this.io = io;
        this.kafka = new Kafka({
            clientId: 'stratum-ws-gateway',
            brokers: (process.env.KAFKA_BOOTSTRAP_SERVERS || 'localhost:9092').split(','),
            retry: { initialRetryTime: 1000, retries: 10 },
        });
        this.consumer = this.kafka.consumer({
            groupId: 'stratum-ws-gateway-group',
        });
    }

    async start(): Promise<void> {
        await this.consumer.connect();
        await this.consumer.subscribe({ topics: KAFKA_TOPICS, fromBeginning: false });

        await this.consumer.run({
            eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
                try {
                    const value = JSON.parse(message.value?.toString() || '{}');
                    const event: StratumEvent = {
                        topic,
                        partition,
                        offset: message.offset,
                        timestamp: message.timestamp,
                        key: message.key?.toString() || null,
                        value,
                    };

                    // Route to appropriate room
                    const room = this.topicToRoom(topic);
                    this.io.to(room).emit('stratum:event', event);
                    this.io.to('global').emit('stratum:event', event); // Global broadcast room

                } catch (err) {
                    logger.error(`Kafka message parse error on ${topic}: ${err}`);
                }
            },
        });

        logger.info(`✅ Kafka → WebSocket bridge active on ${KAFKA_TOPICS.length} topics`);
    }

    async stop(): Promise<void> {
        await this.consumer.disconnect();
    }

    private topicToRoom(topic: string): string {
        const roomMap: Record<string, string> = {
            'stratum.validated.events': 'sensors',
            'stratum.alerts.anomaly': 'alerts',
            'stratum.simulation.results': 'simulations',
            'stratum.ledger.decisions': 'ledger',
            'stratum.governance.rulings': 'governance',
            'stratum.cyber.threats': 'cyber',
            'stratum.orchestration.actions': 'actions',
        };
        return roomMap[topic] || 'general';
    }
}

// ===========================================================================
// AUTH MIDDLEWARE
// ===========================================================================

function verifyToken(token: string): { userId: string; role: string } | null {
    try {
        const secret = process.env.JWT_SECRET_KEY || 'dev-secret';
        const decoded = jwt.verify(token, secret) as { userId: string; role: string };
        return decoded;
    } catch {
        return null;
    }
}

// ===========================================================================
// SERVER SETUP
// ===========================================================================

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'stratum-ws-gateway', timestamp: new Date().toISOString() });
});

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    pingTimeout: 60000,
    pingInterval: 25000,
});

// Auth middleware
io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers['x-auth-token'];
    if (!token) {
        // In dev mode, allow unauthenticated connections
        if (process.env.STRATUM_ENV === 'development') {
            socket.data.userId = 'dev-user';
            socket.data.role = 'ADMIN';
            return next();
        }
        return next(new Error('Authentication required'));
    }

    const user = verifyToken(token as string);
    if (!user) return next(new Error('Invalid token'));

    socket.data.userId = user.userId;
    socket.data.role = user.role;
    next();
});

// Connection handler
io.on('connection', (socket: Socket) => {
    logger.info(`✅ Client connected: ${socket.id} | User: ${socket.data.userId} | Role: ${socket.data.role}`);

    // Auto-join global room
    socket.join('global');

    // Room subscription management
    socket.on('subscribe', (rooms: string[]) => {
        rooms.forEach(room => {
            const allowedRooms = ['sensors', 'alerts', 'simulations', 'ledger', 'governance', 'cyber', 'actions'];
            if (allowedRooms.includes(room)) {
                socket.join(room);
                logger.debug(`${socket.id} joined room: ${room}`);
            }
        });
        socket.emit('subscribed', { rooms });
    });

    socket.on('unsubscribe', (rooms: string[]) => {
        rooms.forEach(room => socket.leave(room));
    });

    socket.on('disconnect', () => {
        logger.info(`❌ Client disconnected: ${socket.id}`);
    });
});

// Start everything
const PORT = parseInt(process.env.WEBSOCKET_PORT || '9000');
const bridge = new KafkaWebSocketBridge(io);

httpServer.listen(PORT, async () => {
    logger.info(`🌐 WebSocket Gateway running on port ${PORT}`);
    try {
        await bridge.start();
    } catch (err) {
        logger.error(`Kafka bridge startup error: ${err} — running without Kafka`);
    }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    await bridge.stop();
    httpServer.close();
    process.exit(0);
});
