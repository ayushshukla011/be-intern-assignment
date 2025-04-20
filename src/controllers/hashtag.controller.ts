import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { Hashtag } from '../entities/Hashtag';
import { validate } from '../utils/validator';
import { createHashtagSchema, getHashtagSchema, getHashtagByNameSchema, deleteHashtagSchema, getPostsByHashtagSchema } from '../validations/hashtag.validation';

export const createHashtag = async (req: Request, res: Response) => {
  try {
    const { error, value } = validate(createHashtagSchema, req.body);
    if (error) return res.status(400).json({ error: error.message });

    const { name } = value;

    const hashtagRepository = getRepository(Hashtag);
    
    // Check if hashtag already exists
    const existingHashtag = await hashtagRepository.findOne({ where: { name } });
    if (existingHashtag) {
      return res.status(400).json({ error: 'Hashtag already exists' });
    }

    const hashtag = hashtagRepository.create({ name });
    const savedHashtag = await hashtagRepository.save(hashtag);

    return res.status(201).json(savedHashtag);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getHashtags = async (req: Request, res: Response) => {
  try {
    const hashtagRepository = getRepository(Hashtag);
    const hashtags = await hashtagRepository.find();

    return res.json(hashtags);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getHashtagById = async (req: Request, res: Response) => {
  try {
    const { error, value } = validate(getHashtagSchema, req.params);
    if (error) return res.status(400).json({ error: error.message });

    const { id } = value;

    const hashtagRepository = getRepository(Hashtag);
    const hashtag = await hashtagRepository.findOne({ where: { id } });

    if (!hashtag) {
      return res.status(404).json({ error: 'Hashtag not found' });
    }

    return res.json(hashtag);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getHashtagByName = async (req: Request, res: Response) => {
  try {
    const { error, value } = validate(getHashtagByNameSchema, req.params);
    if (error) return res.status(400).json({ error: error.message });

    const { name } = value;

    const hashtagRepository = getRepository(Hashtag);
    const hashtag = await hashtagRepository.findOne({ where: { name } });

    if (!hashtag) {
      return res.status(404).json({ error: 'Hashtag not found' });
    }

    return res.json(hashtag);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteHashtag = async (req: Request, res: Response) => {
  try {
    const { error, value } = validate(deleteHashtagSchema, req.params);
    if (error) return res.status(400).json({ error: error.message });

    const { id } = value;

    const hashtagRepository = getRepository(Hashtag);
    const hashtag = await hashtagRepository.findOne({ where: { id } });

    if (!hashtag) {
      return res.status(404).json({ error: 'Hashtag not found' });
    }

    await hashtagRepository.remove(hashtag);

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}; 