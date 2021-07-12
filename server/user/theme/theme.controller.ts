import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'server/auth/guards/jwt.guard';
import { ThemeDto } from '../../../shared/dto/theme/theme.dto';
import { ThemeService } from './theme.service';

@ApiTags('User')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('user/theme')
export class ThemeController {
  constructor(private themeService: ThemeService) {}

  @Get()
  @ApiOperation({ summary: 'Gets all themes owned by user' })
  getThemes(@Req() req: any): Promise<ThemeDto[]> {
    return this.themeService.getThemes(req);
  }

  @Post()
  @ApiOperation({ summary: 'Adds a theme for the current user' })
  addTheme(@Req() req: any, @Body('theme') theme: ThemeDto): Promise<boolean> {
    return this.themeService.addTheme(req, theme);
  }

  @Put()
  @ApiOperation({ summary: 'Updates a theme for the current user' })
  updateTheme(@Req() req: any, @Body('theme') theme: ThemeDto): Promise<boolean> {
    return this.themeService.updateTheme(req, theme);
  }

  @Delete(':themeValue')
  @ApiOperation({ summary: 'Deletes a theme for the current user' })
  deleteTheme(@Req() req: any, @Param('themeValue') value: string): Promise<boolean> {
    return this.themeService.deleteTheme(req, value);
  }
}