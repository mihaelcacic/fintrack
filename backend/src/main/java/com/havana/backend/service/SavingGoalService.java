package com.havana.backend.service;

import com.havana.backend.data.CreateSavingGoalRequest;
import com.havana.backend.data.SavingGoalResponse;
import com.havana.backend.model.SavingGoal;
import com.havana.backend.model.User;
import com.havana.backend.repository.SavingGoalRepository;
import com.havana.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SavingGoalService {
    private final SavingGoalRepository savingGoalRepository;
    private final UserRepository userRepository;

    public List<SavingGoalResponse> getSavingGoals(Integer userId) {
        return savingGoalRepository.findByUserId(userId)
                .stream()
                .map(goal -> new SavingGoalResponse(
                        goal.getId(),
                        goal.getName(),
                        goal.getTargetAmount(),
                        goal.getCurrentAmount(),
                        goal.getDeadline()
                ))
                .toList();
    }

    public SavingGoalResponse createSavingGoal(Integer userId, CreateSavingGoalRequest request) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("Korisnik ne postoji"));

        SavingGoal goal = new SavingGoal();
        goal.setUser(user);
        goal.setName(request.name());
        goal.setTargetAmount(request.targetAmount());
        goal.setDeadline(request.deadline());
        goal.setCurrentAmount(BigDecimal.ZERO);

        savingGoalRepository.save(goal);
        return toResponse(goal);
    }

    public SavingGoalResponse addSavingAmount(
            Integer goalId,
            Integer userId,
            BigDecimal amount
    ) {
        SavingGoal goal = savingGoalRepository
                .findByIdAndUserId(goalId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Cilj ne postoji"));

        goal.setCurrentAmount(
                goal.getCurrentAmount().add(amount)
        );

        savingGoalRepository.save(goal);
        return toResponse(goal);
    }

    public void deleteSavingGoal(Integer goalId, Integer userId) {

        SavingGoal goal = savingGoalRepository
                .findByIdAndUserId(goalId, userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Cilj ne postoji ili ne pripada korisniku")
                );

        savingGoalRepository.delete(goal);
    }

    private SavingGoalResponse toResponse(SavingGoal goal) {
        return new SavingGoalResponse(
                goal.getId(),
                goal.getName(),
                goal.getTargetAmount(),
                goal.getCurrentAmount(),
                goal.getDeadline()
        );
    }
}
