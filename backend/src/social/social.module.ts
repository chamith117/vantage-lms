import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { Reaction } from './entities/reaction.entity';
import { Idea } from './entities/idea.entity';
import { SocialService } from './social.service';
import { SocialController } from './social.controller';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment, Reaction, Idea]),
    GamificationModule,
  ],
  providers: [SocialService],
  controllers: [SocialController],
  exports: [SocialService],
})
export class SocialModule {}
