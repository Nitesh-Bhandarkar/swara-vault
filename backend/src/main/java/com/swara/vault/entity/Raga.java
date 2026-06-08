package com.swara.vault.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "raga")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Raga {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private boolean janya;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "janaka_raga_id")
    private Raga janakaRaga;

    @Column(name = "melakarta_number")
    private Integer melakarataNumber;

    @Column(columnDefinition = "TEXT")
    private String arohana;

    @Column(name = "arohana_audio_url")
    private String arohanaAudioUrl;

    @Column(columnDefinition = "TEXT")
    private String avarohana;

    @Column(name = "avarohana_audio_url")
    private String avarohanaAudioUrl;

    @Column(name = "is_seeded", nullable = false)
    private boolean seeded = false;

    @OneToMany(mappedBy = "raga", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Composition> compositions = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
