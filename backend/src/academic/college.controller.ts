import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { CollegeService } from './college.service';
import { CreateCollegeDto, UpdateCollegeDto } from './college.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('colleges')
@UseGuards(JwtAuthGuard)
export class CollegeController {
  constructor(private readonly collegeService: CollegeService) {}

  @Post()
  create(@Body() createCollegeDto: CreateCollegeDto) {
    return this.collegeService.create(createCollegeDto);
  }

  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    return this.collegeService.findAllPaginated(page, limit, {
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      search,
    });
  }

  @Get('count')
  count() {
    return this.collegeService.count();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.collegeService.findOne(id);
  }

  @Get('code/:code')
  findByCode(@Param('code') code: string) {
    return this.collegeService.findByCode(code);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCollegeDto: UpdateCollegeDto) {
    return this.collegeService.update(id, updateCollegeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.collegeService.remove(id);
  }
}
