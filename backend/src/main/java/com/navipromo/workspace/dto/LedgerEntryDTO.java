package com.navipromo.workspace.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LedgerEntryDTO {
    private LocalDate date;
    private String refType;
    private String refId;
    private String description;
    private BigDecimal debit;
    private BigDecimal credit;
    private UUID clientId;
    private String category;
}
