package com.swara.vault.repository;

import com.swara.vault.entity.Raga;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RagaRepository extends JpaRepository<Raga, UUID> {

    Optional<Raga> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);

    @EntityGraph(attributePaths = "janakaRaga")
    Page<Raga> findAll(Pageable pageable);

    @EntityGraph(attributePaths = "janakaRaga")
    Page<Raga> findByNameContainingIgnoreCase(String name, Pageable pageable);

    @EntityGraph(attributePaths = "janakaRaga")
    Page<Raga> findByJanya(boolean janya, Pageable pageable);

    @EntityGraph(attributePaths = "janakaRaga")
    Page<Raga> findByNameContainingIgnoreCaseAndJanya(String name, boolean janya, Pageable pageable);

    List<Raga> findByJanyaFalseOrderByMelakarataNumber();
}
