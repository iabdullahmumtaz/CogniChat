import express from 'express';
import Conversation from '../models/Conversation.js';
import { chatCompletion } from '../services/openai.js';
import { searchSimilarChunks } from '../services/vectorSearch.js';

import { errorMessage } from '../utils/errors.js';

const router = express.Router();

router.get('/conversations', async (_req, res) => {
  try {
    const conversations = await Conversation.find()
      .sort({ updatedAt: -1 })
      .select('title createdAt updatedAt messages');
    res.json(
      conversations.map((c) => ({
        _id: c._id,
        title: c.title,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        messageCount: c.messages.length,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: errorMessage(err) });
  }
});

router.get('/conversations/:id', async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ error: 'Not found' });
    res.json(conversation);
  } catch (err) {
    res.status(500).json({ error: errorMessage(err) });
  }
});

router.post('/conversations', async (req, res) => {
  try {
    const conversation = await Conversation.create({
      title: req.body.title || 'New Chat',
    });
    res.status(201).json(conversation);
  } catch (err) {
    res.status(500).json({ error: errorMessage(err) });
  }
});

router.delete('/conversations/:id', async (req, res) => {
  try {
    await Conversation.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: errorMessage(err) });
  }
});

router.post('/conversations/:id/messages', async (req, res) => {
  try {
    const { content, useRag = true } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ error: 'Message content required' });
    }

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ error: 'Not found' });

    conversation.messages.push({ role: 'user', content: content.trim() });

    if (conversation.messages.length === 1) {
      conversation.title = content.trim().slice(0, 50);
    }

    let context = '';
    if (useRag) {
      const chunks = await searchSimilarChunks(content);
      if (chunks.length) {
        context = chunks
          .map((c, i) => `[Source ${i + 1}: ${c.documentName}]\n${c.text}`)
          .join('\n\n');
      }
    }

    const history = conversation.messages.slice(-20).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const systemPrompt = context
      ? `You are CogniChat, a helpful AI assistant. Use the following context from uploaded documents when relevant. If the context doesn't help, answer from general knowledge.\n\nContext:\n${context}`
      : 'You are CogniChat, a helpful AI assistant with memory of the conversation.';

    const reply = await chatCompletion([
      { role: 'system', content: systemPrompt },
      ...history,
    ]);

    conversation.messages.push({ role: 'assistant', content: reply });
    await conversation.save();

    res.json({
      message: conversation.messages[conversation.messages.length - 1],
      sources: context ? 'RAG context applied' : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: errorMessage(err) });
  }
});

export default router;
