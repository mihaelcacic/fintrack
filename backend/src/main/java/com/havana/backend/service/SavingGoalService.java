package com.havana.backend.service;

import com.havana.backend.data.CreateSavingGoalRequest;
import com.havana.backend.data.MonthlyBalanceRecord;
import com.havana.backend.data.SavingGoalResponse;
import com.havana.backend.model.Category;
import com.havana.backend.model.SavingGoal;
import com.havana.backend.model.Transaction;
import com.havana.backend.model.User;
import com.havana.backend.repository.CategoryRepository;
import com.havana.backend.repository.SavingGoalRepository;
import com.havana.backend.repository.TransactionRepository;
import com.havana.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static com.havana.backend.model.CategoryType.EXPENSE;

@Service
@RequiredArgsConstructor
public class SavingGoalService {
    private final SavingGoalRepository savingGoalRepository;
    private final UserRepository userRepository;
    private final TransactionService transactionService;
    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;

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
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Iznos mora biti veći od 0");
        }

        SavingGoal goal = savingGoalRepository
                .findByIdAndUserId(goalId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Cilj ne postoji"));

        MonthlyBalanceRecord balance =
                transactionService.getCurrentMonthBalance(userId);

        BigDecimal available = balance.balance();

        //if (available.compareTo(BigDecimal.ZERO) <= 0) {
          //  throw new IllegalStateException(
            //        "Nemate raspoloživog novca za štednju"
            //);
        //}

        //if (amount.compareTo(available) > 0) {
          //  throw new IllegalStateException(
            //        "Nemate dovoljno raspoloživog novca"
            //);
        //}

        goal.setCurrentAmount(
                goal.getCurrentAmount().add(amount)
        );

        savingGoalRepository.save(goal);

        createSavingTransaction(goal, userId, amount);

        return toResponse(goal);
    }

    private void createSavingTransaction(SavingGoal goal, Integer userId, BigDecimal amount) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Korisnik nije pronađen"));

        // Pronađi ili kreiraj kategoriju sa imenom štednog cilja
        Category savingCategory = getOrCreateCategoryForSavingGoal(goal, user);

        // Kreiraj transakciju
        Transaction transaction = new Transaction();
        transaction.setAmount(amount);
        transaction.setTransactionDate(LocalDate.now());
        transaction.setDescription(goal.getName());
        transaction.setUser(user);
        transaction.setCategory(savingCategory);
        transactionRepository.save(transaction);

    }

    private Category getOrCreateCategoryForSavingGoal(SavingGoal goal, User user) {
        // Koristi ime štednog cilja kao naziv kategorije
        String categoryName = "Štednja";

        // Provjeri da li kategorija već postoji za ovog korisnika
        Optional<Category> existingCategory = categoryRepository
                .findByUserAndName(user,  categoryName);

        if (existingCategory.isPresent()) {
            // Ako postoji, provjeri je li tip EXPENSE, ako ne, ažuriraj
            Category category = existingCategory.get();
            if (!"EXPENSE".equals(category.getType())) {
                category.setType(EXPENSE);
                categoryRepository.save(category);
            }
            return category;
        }

        // Ako ne postoji, kreiraj novu kategoriju
        Category newCategory = new Category();
        newCategory.setName(categoryName);
        newCategory.setType(EXPENSE); // Štednja je trošak
        newCategory.setUser(user);

        return categoryRepository.save(newCategory);
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
