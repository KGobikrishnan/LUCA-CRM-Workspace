package com.navipromo.workspace.config;

import com.navipromo.workspace.entity.*;
import com.navipromo.workspace.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ClientRepository clientRepository;
    private final LeadRepository leadRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final GeneralLedgerRepository generalLedgerRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public DataSeeder(UserRepository userRepository,
                      ClientRepository clientRepository,
                      LeadRepository leadRepository,
                      ProjectRepository projectRepository,
                      TaskRepository taskRepository,
                      GeneralLedgerRepository generalLedgerRepository,
                      PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.clientRepository = clientRepository;
        this.leadRepository = leadRepository;
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
        this.generalLedgerRepository = generalLedgerRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        seedUsers();
        // seedLeads();
        // seedClients();
        // seedProjects();
        // seedTasks();
        // seedGeneralLedger();
        System.out.println("✅ Admin User Check Completed.");
    }

    // ─── USERS ──────────────────────────────────────────────
    private void seedUsers() {
        if (userRepository.findByEmail("luca@navipromo.com").isEmpty()) {
            User admin = new User();
            admin.setEmployeeId("EMP-0001");
            admin.setFullName("Luca Admin");
            admin.setEmail("luca@navipromo.com");
            admin.setPasswordHash(passwordEncoder.encode("password123"));
            admin.setRole("Super Admin");
            admin.setDesignation("CEO");
            admin.setPhone("9876543210");
            admin.setCity("Theni");
            admin.setIsActive(true);
            userRepository.save(admin);
        }
    }

    // ─── LEADS ──────────────────────────────────────────────
    private void seedLeads() {
        if (leadRepository.count() == 0) {
            leadRepository.save(createLead("LEAD-0001", "Vijay Kumar", "Vijay Enterprises", "vijay@test.com", "9988776655", "Business", "Website", "High", "Prospect", "New", new BigDecimal("150000")));
            leadRepository.save(createLead("LEAD-0002", "Suresh Babu", "Suresh & Co", "suresh@test.com", "8877665544", "Individual", "Instagram", "Medium", "Lead", "Contacted", new BigDecimal("50000")));
            leadRepository.save(createLead("LEAD-0003", "Priya Devi", "Priya Designs", "priya@designs.com", "7766554433", "Business", "Referral", "High", "Qualified", "Proposal Sent", new BigDecimal("320000")));
            leadRepository.save(createLead("LEAD-0004", "Manoj Singh", "Singh Traders", "manoj@singh.com", "6655443322", "Organization", "Google Ads", "Low", "Negotiation", "Follow-up", new BigDecimal("80000")));
            leadRepository.save(createLead("LEAD-0005", "Aisha Banu", "Banu Creations", "aisha@banu.com", "5544332211", "Individual", "Cold Call", "Medium", "Prospect", "New", new BigDecimal("200000")));
        }
    }

    private Lead createLead(String id, String name, String org, String email, String phone, String type, String source, String priority, String stage, String status, BigDecimal value) {
        Lead lead = new Lead();
        lead.setLeadId(id);
        lead.setLeadName(name);
        lead.setCompanyOrg(org);
        lead.setEmail(email);
        lead.setPhone(phone);
        lead.setWhatsapp(phone);
        lead.setCity("Theni");
        lead.setType(type);
        lead.setSource(source);
        lead.setPriority(priority);
        lead.setPipelineStage(stage);
        lead.setStatus(status);
        lead.setExpectedValue(value);
        return lead;
    }

    // ─── CLIENTS ────────────────────────────────────────────
    private void seedClients() {
        if (clientRepository.count() == 0) {
            clientRepository.save(createClient("CLT-0001", "Navi Promotions", "Luca", "luca@navipromo.com", "9876543210", "Business", "Active", "Advance", "Theni"));
            clientRepository.save(createClient("CLT-0002", "AK Group", "Arun Kumar", "arun@ak.com", "8765432109", "Organization", "Active", "50-50", "Chennai"));
            clientRepository.save(createClient("CLT-0003", "Devi Textiles", "Devi Lakshmi", "devi@textiles.com", "7654321098", "Business", "Active", "Net-30", "Madurai"));
            clientRepository.save(createClient("CLT-0004", "KM Associates", "Karthi Murugan", "km@associates.com", "6543210987", "Individual", "Inactive", "Advance", "Coimbatore"));
            clientRepository.save(createClient("CLT-0005", "Star Studios", "Senthil", "senthil@star.com", "5432109876", "Business", "Active", "Net-15", "Theni"));
        }
    }

    private Client createClient(String id, String bName, String contact, String email, String phone, String type, String status, String terms, String city) {
        Client client = new Client();
        client.setClientId(id);
        client.setBusinessName(bName);
        client.setPrimaryContact(contact);
        client.setEmail(email);
        client.setPhone(phone);
        client.setType(type);
        client.setStatus(status);
        client.setPaymentTerms(terms);
        client.setCity(city);
        return client;
    }

    // ─── PROJECTS ───────────────────────────────────────────
    private void seedProjects() {
        if (projectRepository.count() == 0) {
            projectRepository.save(createProject("PRJ-0001", "Workspace App", "Full-stack ERP/CRM development", "One-Time", "Active", "High", "Green"));
            projectRepository.save(createProject("PRJ-0002", "Marketing Campaign", "Digital marketing for Q1", "Monthly Retainer", "Active", "Medium", "Green"));
            projectRepository.save(createProject("PRJ-0003", "Mobile App Launch", "iOS & Android launch", "One-Time", "On Hold", "High", "Amber"));
            projectRepository.save(createProject("PRJ-0004", "Server Maintenance", "Annual maintenance contract", "AMC", "Active", "Low", "Green"));
            projectRepository.save(createProject("PRJ-0005", "Cloud Migration", "Migrate on-prem to AWS", "One-Time", "Onboarding", "Critical", "Red"));
        }
    }

    private Project createProject(String id, String name, String desc, String type, String status, String priority, String health) {
        Project p = new Project();
        p.setProjectId(id);
        p.setProjectName(name);
        p.setDescription(desc);
        p.setType(type);
        p.setStatus(status);
        p.setPriority(priority);
        p.setHealth(health);
        p.setStartDate(LocalDate.now().minusDays(10));
        p.setTargetEnd(LocalDate.now().plusDays(30));
        return p;
    }

    // ─── TASKS ──────────────────────────────────────────────
    private void seedTasks() {
        if (taskRepository.count() == 0) {
            taskRepository.save(createTask("TSK-0001", "Setup Security", "Configure JWT & RBAC", "Critical", "In Progress", "Development", "Sprint"));
            taskRepository.save(createTask("TSK-0002", "Dashboard UI", "Build Finance and Work tabs", "High", "To Do", "Design", "Sprint"));
            taskRepository.save(createTask("TSK-0003", "Bug Fixes", "Fix CORS and auth issues", "Medium", "Completed", "Development", "Milestone"));
            taskRepository.save(createTask("TSK-0004", "API Documentation", "Create Swagger docs", "Low", "To Do", "Documentation", "Sprint"));
            taskRepository.save(createTask("TSK-0005", "Database Optimization", "Index and optimize queries", "High", "In Progress", "DevOps", "Milestone"));
        }
    }

    private Task createTask(String id, String title, String desc, String priority, String status, String type, String deliveryType) {
        Task t = new Task();
        t.setTaskId(id);
        t.setTitle(title);
        t.setDescription(desc);
        t.setPriority(priority);
        t.setStatus(status);
        t.setTaskType(type);
        t.setDeliveryType(deliveryType);
        t.setStartDate(LocalDate.now());
        t.setDueDate(LocalDate.now().plusDays(7));
        return t;
    }

    // ─── GENERAL LEDGER ─────────────────────────────────────
    private void seedGeneralLedger() {
        if (generalLedgerRepository.count() == 0) {
            generalLedgerRepository.save(createLedger("Main Operating Account", "Credit", new BigDecimal("1000000"), "Initial Capital Injection", "CAP-001", "Reconciled"));
            generalLedgerRepository.save(createLedger("Main Operating Account", "Debit", new BigDecimal("50000"), "Office Rent - April", "RENT-001", "Reconciled"));
            generalLedgerRepository.save(createLedger("Revenue Account", "Credit", new BigDecimal("200000"), "Client Payment - CLT-0001", "INV-001", "Reconciled"));
            generalLedgerRepository.save(createLedger("Expense Account", "Debit", new BigDecimal("15000"), "Software Licenses", "EXP-001", "Pending"));
            generalLedgerRepository.save(createLedger("Revenue Account", "Credit", new BigDecimal("85000"), "Client Payment - CLT-0002", "INV-002", "Reconciled"));
        }
    }

    private GeneralLedger createLedger(String account, String entryType, BigDecimal amount, String desc, String refId, String status) {
        GeneralLedger entry = new GeneralLedger();
        entry.setEntryDate(LocalDate.now());
        entry.setAccountName(account);
        entry.setEntryType(entryType);
        entry.setAmount(amount);
        entry.setDescription(desc);
        entry.setReferenceId(refId);
        entry.setStatus(status);
        return entry;
    }
}