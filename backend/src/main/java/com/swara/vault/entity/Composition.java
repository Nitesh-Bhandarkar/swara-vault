package com.swara.vault.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "composition")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Composition {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "raga_id", nullable = false)
    private Raga raga;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CompositionType type;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 100)
    private String tala;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "composition_audio_url", joinColumns = @JoinColumn(name = "composition_id"))
    @Column(name = "audio_url", nullable = false)
    @OrderColumn(name = "position")
    @Builder.Default
    private List<String> audioUrls = new ArrayList<>();
}
