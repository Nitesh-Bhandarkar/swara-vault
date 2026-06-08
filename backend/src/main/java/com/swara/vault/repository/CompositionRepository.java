package com.swara.vault.repository;

import com.swara.vault.entity.Composition;
import com.swara.vault.entity.CompositionType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface CompositionRepository extends JpaRepository<Composition, UUID> {
    List<Composition> findByRagaIdAndType(UUID ragaId, CompositionType type);
    List<Composition> findByRagaId(UUID ragaId);
}
