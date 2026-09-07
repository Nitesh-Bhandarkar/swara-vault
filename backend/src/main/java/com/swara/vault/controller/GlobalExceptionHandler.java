package com.swara.vault.controller;

import com.swara.vault.exception.ForbiddenOperationException;
import com.swara.vault.exception.ResourceNotFoundException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.sql.SQLException;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<?> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(404).body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(ForbiddenOperationException.class)
    public ResponseEntity<?> handleForbidden(ForbiddenOperationException ex) {
        return ResponseEntity.status(403).body(Map.of("message", ex.getMessage()));
    }

    // Referential-integrity SQLState codes (portable across H2 and, previously, Postgres)
    private static final Set<String> FOREIGN_KEY_SQL_STATES = Set.of("23503", "23506");

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<?> handleDataIntegrity(DataIntegrityViolationException ex) {
        String sqlState = extractSqlState(ex);
        String message = FOREIGN_KEY_SQL_STATES.contains(sqlState)
            ? "Cannot delete: this raga is referenced by other ragas"
            : "Data integrity error: " + rootMessage(ex);
        return ResponseEntity.status(409).body(Map.of("message", message));
    }

    private String extractSqlState(DataIntegrityViolationException ex) {
        return (ex.getMostSpecificCause() instanceof SQLException sqlEx) ? sqlEx.getSQLState() : null;
    }

    private String rootMessage(DataIntegrityViolationException ex) {
        String root = ex.getMostSpecificCause().getMessage();
        return root != null ? root : ex.getMessage();
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = ex.getBindingResult().getFieldErrors().stream()
            .collect(Collectors.toMap(
                FieldError::getField,
                fe -> fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "Invalid value",
                (a, b) -> a
            ));
        return ResponseEntity.badRequest().body(Map.of("errors", errors));
    }
}
