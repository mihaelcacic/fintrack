package com.havana.backend.repository;

import com.havana.backend.model.SavingGoal;
import com.havana.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SavingGoalRepository extends JpaRepository<SavingGoal, Integer> {

    List<SavingGoal> findByUser(User user);

    List<SavingGoal> findByUserId(Integer userId);

    Optional<SavingGoal> findByIdAndUserId(Integer id, Integer userId);
}
