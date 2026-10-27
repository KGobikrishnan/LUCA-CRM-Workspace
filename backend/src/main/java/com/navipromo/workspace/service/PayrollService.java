package com.navipromo.workspace.service;

import com.navipromo.workspace.entity.Payroll;
import com.navipromo.workspace.entity.User;
import com.navipromo.workspace.repository.PayrollRepository;
import com.navipromo.workspace.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PayrollService {
    private final PayrollRepository repository;
    private final UserRepository userRepository;

    public List<Payroll> findAll() {
        return repository.findAll();
    }
    
    public List<Payroll> findByPayPeriod(String period) {
        return repository.findByPayPeriod(period);
    }

    public Payroll findById(UUID id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Payroll not found"));
    }

    public Payroll save(Payroll entity) {
        if (entity.getAdditions() == null) entity.setAdditions(BigDecimal.ZERO);
        if (entity.getManualBonus() == null) entity.setManualBonus(BigDecimal.ZERO);
        if (entity.getDeductions() == null) entity.setDeductions(BigDecimal.ZERO);
        if (entity.getBasicSalary() == null) entity.setBasicSalary(BigDecimal.ZERO);
        
        BigDecimal netPay = entity.getBasicSalary().add(entity.getAdditions()).add(entity.getManualBonus()).subtract(entity.getDeductions());
        entity.setNetPay(netPay);
        
        return repository.save(entity);
    }

    public void deleteById(UUID id) {
        repository.deleteById(id);
    }
    
    public List<Payroll> generatePayrollForPeriod(String payPeriod) {
        List<User> activeUsers = userRepository.findAll().stream().filter(u -> Boolean.TRUE.equals(u.getIsActive())).toList();
        
        for (User user : activeUsers) {
            if (!repository.existsByUserIdAndPayPeriod(user.getId(), payPeriod)) {
                Payroll payroll = new Payroll();
                payroll.setUserId(user.getId());
                payroll.setPayPeriod(payPeriod);
                
                BigDecimal basic = user.getMonthlySalary() != null ? BigDecimal.valueOf(user.getMonthlySalary()) : BigDecimal.ZERO;
                payroll.setBasicSalary(basic);
                payroll.setAdditions(BigDecimal.ZERO);
                payroll.setManualBonus(BigDecimal.ZERO);
                payroll.setDeductions(BigDecimal.ZERO);
                payroll.setNetPay(basic);
                payroll.setStatus("Pending");
                payroll.setNotes("Generated for " + payPeriod);
                
                repository.save(payroll);
            }
        }
        
        return repository.findByPayPeriod(payPeriod);
    }
}
