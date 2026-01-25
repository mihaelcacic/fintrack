package com.havana.backend.service;

import com.havana.backend.repository.CategoryRepository;
import com.havana.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddressList;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Service
@RequiredArgsConstructor
public class TransactionTemplateXlsxService {

    // generiranje tablice u koju se upisuju transakcije
    public ByteArrayInputStream generateExcelTemplate() {
        try (Workbook workbook = new XSSFWorkbook()) {

            Sheet sheet = workbook.createSheet("Transactions");

            // stupci
            Row header = sheet.createRow(0);
            String[] columns = {
                    "transaction_date",
                    "amount",
                    "description",
                    "category_name",
                    "category_type"
            };

            CellStyle headerStyle = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            for (int i = 0; i < columns.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
                sheet.autoSizeColumn(i);
            }

            DataValidationHelper validationHelper =
                    sheet.getDataValidationHelper();

            DataValidationConstraint constraint =
                    validationHelper.createExplicitListConstraint(
                            new String[]{"INCOME", "EXPENSE"}
                    );

            CellRangeAddressList addressList =
                    new CellRangeAddressList(1, 1000, 4, 4);

            DataValidation validation =
                    validationHelper.createValidation(constraint, addressList);

            validation.setSuppressDropDownArrow(false);
            validation.setShowErrorBox(true);
            sheet.addValidationData(validation);

            // ovo je format datuma, kako treba izgledati
            CellStyle dateStyle = workbook.createCellStyle();
            CreationHelper creationHelper = workbook.getCreationHelper();
            dateStyle.setDataFormat(
                    creationHelper.createDataFormat().getFormat("yyyy-mm-dd")
            );

            for (int i = 1; i <= 1000; i++) {
                sheet.createRow(i).createCell(0).setCellStyle(dateStyle);
            }

            // ovdje je export datoteke
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());

        } catch (IOException e) {
            throw new RuntimeException("Greška pri generiranju Excel template-a", e);
        }
    }
}

