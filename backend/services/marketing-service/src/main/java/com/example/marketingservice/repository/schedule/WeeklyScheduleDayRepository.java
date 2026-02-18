package com.example.marketingservice.repository.schedule;

import com.example.marketingservice.entity.schedule.WeeklyScheduleDay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WeeklyScheduleDayRepository extends JpaRepository<WeeklyScheduleDay, Long> {

    List<WeeklyScheduleDay> findByWeeklyScheduleIdOrderByDayNumber(Long weeklyScheduleId);

    List<WeeklyScheduleDay> findByWeeklyScheduleIdAndInMonthTrueOrderByDayNumber(Long weeklyScheduleId);

    List<WeeklyScheduleDay> findByWeeklyScheduleId(Long weeklyScheduleId);

    void deleteByWeeklyScheduleId(Long weeklyScheduleId);
}
