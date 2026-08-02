import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { Reaction } from './entities/reaction.entity';
import { Idea, IdeaStatus } from './entities/idea.entity';
import { GamificationService } from '../gamification/gamification.service';

@Injectable()
export class SocialService {
  constructor(
    @InjectRepository(Comment)
    private commentRepo: Repository<Comment>,
    @InjectRepository(Reaction)
    private reactionRepo: Repository<Reaction>,
    @InjectRepository(Idea)
    private ideaRepo: Repository<Idea>,
    private gamificationService: GamificationService,
  ) {}

  async getLessonComments(lessonId: string): Promise<Comment[]> {
    return this.commentRepo.find({
      where: { lesson_id: lessonId },
      relations: ['user', 'reactions', 'reactions.user'],
      order: { created_at: 'ASC' },
    });
  }

  async addComment(userId: string, lessonId: string, content: string) {
    const comment = this.commentRepo.create({
      user_id: userId,
      lesson_id: lessonId,
      content,
    });
    const saved = await this.commentRepo.save(comment);

    // Award +20 points for active social discussion
    const gamification = await this.gamificationService.awardPoints(userId, 20);

    const fullComment = await this.commentRepo.findOne({
      where: { id: saved.id },
      relations: ['user', 'reactions'],
    });

    return {
      comment: fullComment,
      gamification,
    };
  }

  async toggleReaction(userId: string, commentId: string, emoji: string) {
    let reaction = await this.reactionRepo.findOne({
      where: { comment_id: commentId, user_id: userId, emoji },
    });

    if (reaction) {
      await this.reactionRepo.remove(reaction);
      return { action: 'removed', emoji };
    } else {
      reaction = this.reactionRepo.create({
        comment_id: commentId,
        user_id: userId,
        emoji,
      });
      await this.reactionRepo.save(reaction);
      return { action: 'added', emoji };
    }
  }

  async getIdeas(): Promise<Idea[]> {
    return this.ideaRepo.find({
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }

  async createIdea(userId: string, title: string, description: string): Promise<Idea> {
    const idea = this.ideaRepo.create({
      user_id: userId,
      title,
      description,
      status: IdeaStatus.PENDING,
    });
    const saved = await this.ideaRepo.save(idea);
    // Award +20 points for submitting ideas
    await this.gamificationService.awardPoints(userId, 20);
    return this.ideaRepo.findOne({ where: { id: saved.id }, relations: ['user'] });
  }

  async updateIdeaStatus(ideaId: string, status: IdeaStatus, adminResponse?: string): Promise<Idea> {
    const idea = await this.ideaRepo.findOne({ where: { id: ideaId } });
    if (!idea) {
      throw new NotFoundException('Idea not found');
    }
    idea.status = status;
    if (adminResponse) {
      idea.admin_response = adminResponse;
    }
    return this.ideaRepo.save(idea);
  }
}
