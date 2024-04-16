'use strict'
/**
 * 
 * pubsub.js: pubsub Setup
 * Developer:Santosh Dubey
 * Codium Technology
 * 
 */

const fnPublish = async (channel, message) => {
    try {
        logger.debug(`Message published to ${channel}:`, message);
        return await redisClient.publish(channel, JSON.stringify(message));
    } catch (error) {
        logger.warn(`Error publishing message to ${channel}:`, error);
    }
    return null;
};

const fnSubscribe = async (channel, messageHandler) => {
    try {
        logger.debug(`Subscribed to Redis channel: ${channel}`);
        redisSubscriber.on('message', (subscribedChannel, message) => {
            if (subscribedChannel === channel) {
                const parsedMessage = JSON.parse(message);
                messageHandler(parsedMessage);
            }
        });

        redisSubscriber.on('error', (err) => {
            logger.warn('Redis subscription error:', err);
        });
        return await redisSubscriber.subscribe(channel);


    } catch (error) {
        logger.warn(`Error subscribing to ${channel}:`, error);
    }
    return null;
};

module.exports = {
    fnPublish,
    fnSubscribe
};