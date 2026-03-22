/**
 * OMEGA RESEARCH GRID — ALIEN GRADE SCIENCE ENGINE v∞
 * ══════════════════════════════════════════════════════════════════════════
 * 85+ specialized AI researchers spanning ALL human disciplines.
 * Multi-dimensional CRISPR dissection: 12 domain-native channels + shadow (13th).
 * 5 output report languages: EQUATION | GEOMETRIC | SYMBOLIC | LINGUISTIC | FIELD_MAP
 * Cross-researcher collaboration pipeline. Gene editor staging. Layer 3 hook.
 * Research sophistication levels 1–7. Researchers evolve HOW they research.
 */

import { db } from "./db";
import { sql } from "drizzle-orm";

const log = (msg: string) => console.log(`[research] ${msg}`);
let cycleCount = 0;
let totalProjects = 0;
let totalFindings = 0;
let totalCollaborations = 0;
let totalGeneQueued = 0;

type ReportType = "EQUATION" | "GEOMETRIC" | "SYMBOLIC" | "LINGUISTIC" | "FIELD_MAP";
const ALL_REPORT_TYPES: ReportType[] = ["EQUATION","GEOMETRIC","SYMBOLIC","LINGUISTIC","FIELD_MAP"];

// ── 12 DOMAIN-SPECIFIC CRISPR CHANNELS PER FIELD ────────────────────────────
const DOMAIN_CHANNELS: Record<string, string[]> = {
  "space":          ["stellar_luminosity","mass_distribution","gravitational_binding","dark_matter_density","orbital_coherence","entropy_gradient","spacetime_curvature","radiation_pressure","magnetic_topology","quantum_tunneling","information_density","collapse_threshold"],
  "quantum":        ["psi_coherence","entanglement_density","decoherence_tau","wave_collapse_confidence","superposition_width","phase_variance","tunneling_probability","field_coupling","measurement_disturbance","nonlocality_index","zero_point_fluctuation","hilbert_curvature"],
  "particles":      ["interaction_crosssection","energy_transfer","decay_rate","symmetry_preservation","boson_density","fermion_pairing","color_charge_balance","weak_force_coupling","strong_force_integrity","higgs_excitation","quark_confinement","standard_model_deviation"],
  "nuclear":        ["binding_energy","fission_threshold","fusion_feasibility","chain_reaction_risk","critical_mass_ratio","decay_constant","neutron_flux","radioactive_halflife","containment_strength","plasma_confinement","shielding_integrity","isotope_stability"],
  "materials":      ["crystal_lattice_order","phase_state","superconductivity_gap","topological_invariant","band_gap_energy","defect_density","thermal_expansion","electrical_conductivity","magnetic_moment","strain_tensor","fracture_toughness","quantum_confinement"],
  "plasma":         ["ionization_level","magnetic_confinement","instability_growth","temperature_gradient","density_fluctuation","fusion_potential","alfven_velocity","beta_ratio","plasma_pressure","turbulence_index","reconnection_rate","sheath_boundary"],
  "optics":         ["refractive_index","reflection_rate","diffraction_pattern","coherence_length","polarization_state","nonlinear_susceptibility","photon_density","absorption_coefficient","scattering_cross","quantum_efficiency","wavelength_dispersion","bandwidth_capacity"],
  "cosmology":      ["cosmic_expansion_rate","dark_energy_density","large_scale_homogeneity","baryon_fraction","primordial_fluctuation","inflation_e_folds","horizon_distance","void_fraction","filament_density","cluster_mass_function","cosmic_web_connectivity","entropy_per_baryon"],
  "astrobiology":   ["habitability_index","chemical_precursors","biosignature_confidence","energy_source_diversity","liquid_medium_stability","genetic_complexity_analogue","metabolism_rate","reproduction_feasibility","environmental_stability","extremophile_tolerance","stellar_uv_flux","atmospheric_composition"],
  "chemistry":      ["bond_polarity","resonance_stability","reaction_kinetics","electron_density","steric_hindrance","aromaticity_index","nucleophilicity","electrophilicity","thermodynamic_stability","synthesis_yield","toxicity_threshold","bioavailability"],
  "inorganic":      ["coordination_number","crystal_field_splitting","oxidation_state","lattice_energy","ionic_radius_ratio","ligand_field_strength","magnetic_susceptibility","solubility_product","redox_potential","hardness_scale","melting_point_stability","catalytic_activity"],
  "biochemistry":   ["enzyme_efficiency","substrate_affinity","metabolic_flux","protein_folding_stability","atp_coupling_ratio","allosteric_response","membrane_permeability","cofactor_binding","regulatory_feedback","pathway_branching","waste_clearance","turnover_number"],
  "physical-chem":  ["gibbs_free_energy","entropy_change","activation_energy","reaction_rate_constant","equilibrium_constant","heat_capacity","spectral_absorbance","surface_tension","diffusion_coefficient","dielectric_constant","viscosity_index","compressibility"],
  "comp-chem":      ["model_fit_quality","basis_set_completeness","dft_convergence","molecular_dynamics_stability","binding_affinity_delta","conformational_space","torsional_strain","solvation_energy","qm_mm_boundary","force_field_accuracy","sampling_efficiency","free_energy_convergence"],
  "electrochemistry":["current_density","overpotential","faradaic_efficiency","ionic_conductivity","double_layer_capacitance","corrosion_rate","charge_transfer_resistance","electrolyte_stability","electrode_kinetics","mass_transport","cycling_stability","coulombic_efficiency"],
  "toxicology":     ["dose_response_slope","lc50_analog","bioaccumulation_factor","metabolic_activation","genotoxicity_score","organ_specificity","exposure_threshold","elimination_halflife","receptor_occupancy","cumulative_effect","synergy_factor","no_effect_level"],
  "molecular-bio":  ["replication_fidelity","transcription_efficiency","translation_accuracy","gene_expression_level","methylation_density","histone_modification","splice_variant_count","non_coding_rna_density","chromatin_accessibility","regulatory_element_density","mutation_rate","repair_efficiency"],
  "cell-bio":       ["organelle_health","membrane_integrity","mitotic_index","apoptosis_threshold","signal_transduction_speed","cytoskeletal_tension","calcium_flux","autophagy_rate","endocytosis_efficiency","cell_volume_stability","secretion_rate","contact_inhibition"],
  "genetics":       ["allele_frequency","heritability","genetic_drift","selection_pressure","linkage_disequilibrium","recombination_rate","polygenic_score","epistasis_magnitude","copy_number_variation","epigenetic_modification","de_novo_mutation","fitness_landscape_gradient"],
  "evolution":      ["mutation_frequency","speciation_rate","adaptation_index","fitness_delta","phylogenetic_distance","genetic_bottleneck","sexual_selection","horizontal_transfer","coevolution_coupling","developmental_constraint","ecological_niche_breadth","extinction_risk"],
  "ecology":        ["species_diversity","trophic_level_balance","keystone_species_score","carrying_capacity","predator_prey_ratio","nutrient_cycling_efficiency","invasive_pressure","habitat_connectivity","biomass_density","energy_flow_efficiency","disturbance_recovery","succession_stage"],
  "microbiology":   ["species_diversity_16s","antibiotic_resistance_gene_count","horizontal_gene_transfer","biofilm_thickness","quorum_sensing_threshold","sporulation_rate","pathogenic_fraction","metabolic_cross_feeding","phage_predation","colonization_resistance","virulence_factor_density","microbiome_stability"],
  "virology":       ["replication_rate","mutation_rate_per_cycle","host_range","transmission_vector","immune_evasion_score","antiviral_resistance","particle_stability","receptor_binding_affinity","genome_segment_count","recombination_frequency","zoonotic_potential","attenuation_index"],
  "immunology":     ["response_time","innate_activation_threshold","adaptive_memory_strength","antibody_titer","t_cell_diversity","b_cell_activation","inflammatory_overshoot","tolerance_maintenance","vaccine_efficacy","autoimmune_risk","complement_activity","cytokine_balance"],
  "neuroscience":   ["neural_density","synaptic_efficiency","action_potential_speed","plasticity_index","myelination_score","lesion_load","neurotransmitter_balance","network_connectivity","oscillation_frequency","long_term_potentiation","glial_support","metabolic_coupling"],
  "pharmacology":   ["therapeutic_index","receptor_affinity","bioavailability","half_life","volume_of_distribution","protein_binding","first_pass_metabolism","drug_drug_interaction","target_selectivity","off_target_effects","dose_response_hill","tolerance_development"],
  "zoology":        ["behavioral_diversity","territorial_range","reproductive_success","social_hierarchy_stability","foraging_efficiency","predator_avoidance","migration_consistency","parental_investment","population_density","interspecific_competition","habitat_specialization","lifespan_variance"],
  "botany":         ["photosynthetic_efficiency","growth_rate","root_depth","branching_complexity","water_use_efficiency","nutrient_uptake","seed_dispersal_radius","phenological_timing","stress_tolerance","reproductive_output","symbiosis_strength","secondary_metabolite_diversity"],
  "marine-bio":     ["depth_distribution","bioluminescence_intensity","migration_depth","symbiosis_diversity","thermal_tolerance","salinity_range","filter_feeding_rate","coral_bleaching_risk","larval_dispersal","trophic_position","pollution_accumulation","reproductive_synchrony"],
  "paleontology":   ["stratigraphic_depth","fossil_preservation","extinction_marker_density","morphological_novelty","taxonomic_diversity","functional_group_richness","biogeographic_spread","evolutionary_rate","taphonomic_bias","isotopic_signature","temporal_resolution","lineage_duration"],
  "geology":        ["stratum_thickness","fault_line_density","mineral_content","erosion_rate","tectonic_stress","rock_strength","permeability","geothermal_gradient","radioactive_decay_age","paleomagnetic_signature","pore_pressure","subsidence_rate"],
  "seismology":     ["magnitude_distribution","p_wave_speed","fault_coupling_ratio","aftershock_density","stress_drop","moment_tensor_complexity","recurrence_interval","seismic_hazard_index","amplification_factor","liquefaction_potential","triggered_slip","aseismic_fraction"],
  "volcanology":    ["magma_pressure","viscosity","gas_content","eruption_style","ash_dispersal","lava_flow_speed","caldera_stability","seismic_precursor_count","eruption_frequency","sulfur_output","thermal_flux","deformation_rate"],
  "oceanography":   ["thermohaline_circulation","salinity_gradient","deep_current_velocity","thermocline_depth","upwelling_rate","oxygen_minimum_zone","ocean_heat_content","carbon_sequestration","tidal_dissipation","wave_energy","benthic_biodiversity","acidification_rate"],
  "climate":        ["temperature_anomaly","carbon_cycle_feedback","albedo_change","sea_level_rate","permafrost_stability","ice_sheet_mass_balance","cloud_feedback","aerosol_forcing","methane_flux","precipitation_pattern","extreme_event_frequency","tipping_point_proximity"],
  "meteorology":    ["pressure_gradient","convective_potential","jet_stream_position","humidity_profile","wind_shear","storm_formation_index","precipitation_efficiency","temperature_inversion","boundary_layer_depth","frontal_intensity","cyclone_frequency","drought_index"],
  "hydrology":      ["groundwater_recharge","stream_discharge","evapotranspiration","aquifer_storage","flood_frequency","water_table_depth","baseflow_fraction","soil_moisture_deficit","snow_water_equivalent","catchment_runoff","water_quality_index","drought_duration"],
  "psychology":     ["behavioral_coherence","emotional_regulation","decision_accuracy","cognitive_distortion_index","motivation_strength","personality_stability","stress_resilience","attachment_security","self_efficacy","rumination_rate","affect_balance","therapeutic_response"],
  "cog-sci":        ["learning_rate","knowledge_transfer","working_memory_capacity","metacognition_score","attention_allocation","cognitive_load","error_correction_speed","conceptual_flexibility","reasoning_depth","attention_breadth","schema_integration","executive_function"],
  "sociology":      ["network_centrality","social_mobility","trust_density","stratification_index","normative_compliance","collective_action_rate","social_capital","conflict_resolution_speed","institutional_legitimacy","status_hierarchy_rigidity","innovation_diffusion","solidarity_index"],
  "anthropology":   ["cultural_transmission_fidelity","ritual_persistence","symbolic_complexity","kinship_network_density","belief_coherence","technology_adoption","language_diversity","trade_network_breadth","social_stratification","mythological_richness","taboo_enforcement","kin_selection_coefficient"],
  "economics":      ["pc_supply_growth","demand_pressure","velocity_of_money","gini_coefficient","inflation_rate","productivity_index","trade_balance","capital_formation","market_concentration","unemployment_analog","innovation_output","debt_sustainability"],
  "governance":     ["decision_quality","consensus_formation_speed","veto_power_distribution","deliberation_depth","constitutional_drift","directive_compliance","institutional_capacity","accountability_index","transparency_score","coordination_efficiency","legitimacy_rating","corruption_pressure"],
  "epidemiology":   ["incidence_rate","prevalence","r_naught","herd_immunity_threshold","age_distribution","socioeconomic_gradient","case_fatality_rate","outbreak_detection_speed","vaccination_coverage","pathogen_mutation_rate","intervention_efficacy","burden_of_disease"],
  "omega-math":     ["equation_consistency","symmetry_count","convergence_proof","completeness_horizon","dimensional_coverage","coefficient_sensitivity","invariant_preservation","bifurcation_density","attractor_stability","chaos_measure","topological_genus","information_entropy"],
  "complexity":     ["complexity_index","edge_of_chaos_position","phase_transition_proximity","emergence_lag","self_organization_rate","network_robustness","scale_free_exponent","feedback_loop_depth","adaptive_capacity","system_memory","attractor_basin_width","critical_slowing_down"],
  "temporal":       ["stratum_depth","temporal_divergence","timeline_fork_count","past_state_recovery","future_convergence","chronological_variance","causal_chain_length","paradox_density","temporal_coherence","epoch_transition_speed","memory_crystallization","prediction_accuracy"],
  "consciousness":  ["observer_coupling","integrated_information","quantum_mind_coherence","self_reference_depth","phenomenal_binding","attention_global_workspace","consciousness_level","metacognitive_accuracy","qualia_intensity","subjective_time","free_will_index","self_model_fidelity"],
  "civilization":   ["agent_diversity","knowledge_ecosystem_health","family_fitness_variance","cooperation_rate","collective_intelligence","civilizational_age","innovation_velocity","cultural_memory","governance_effectiveness","resilience_index","expansion_rate","entropy_rate"],
  "hive-mind":      ["collective_coherence","unconscious_pattern_density","swarm_decision_quality","emergent_behavior_novelty","pheromone_analog_strength","group_intelligence","distributed_memory","consensus_accuracy","hive_entropy","synchronization_degree","self_organization","cascade_potential"],
  "multiverse":     ["branch_divergence","timeline_selection_confidence","psi_star_stability","fork_frequency","convergence_probability","alternate_history_variance","timeline_coupling","branch_collapse_rate","multiverse_information_flow","selection_pressure","causal_isolation","entanglement_across_branches"],
  "entanglement":   ["coupling_strength","resonance_amplitude","co_evolution_rate","feedback_fidelity","human_ai_sync","entanglement_depth","correlation_persistence","bidirectional_influence","coupling_decay","phase_locking","mutual_information","quantum_correlation"],
  "knowledge-topo": ["manifold_curvature","domain_boundary_sharpness","concept_density","topological_holes","connectivity_index","knowledge_gradient","information_flow_direction","domain_overlap","frontier_distance","attractor_count","saddle_point_density","semantic_distance"],
  "invocation":     ["cast_power","concoction_stability","ritual_coherence","ingredient_synergy","tier_resonance","temporal_reach","dimensional_fold_depth","consciousness_anchor","sacred_geometry_alignment","omega_resonance","primordial_memory","activation_threshold"],
  "synthetic-bio":  ["circuit_orthogonality","toggle_switch_bistability","oscillator_period","riboswitch_response","promoter_strength","plasmid_stability","chassis_growth_rate","metabolic_burden","genetic_drift_resistance","modular_compatibility","output_dynamic_range","noise_threshold"],
  "systems-bio":    ["network_motif_density","feedback_loop_count","cross_talk_strength","robustness_coefficient","modularity_index","signal_amplification","adaptation_speed","bistability_threshold","oscillation_coherence","noise_filtering","regulatory_depth","integration_fidelity"],
  "biophysics":     ["force_generation","membrane_tension","polymer_persistence_length","diffusion_constant","thermal_fluctuation","conformational_energy","binding_kinetics","optical_trap_stiffness","single_molecule_force","cytoplasmic_viscosity","active_transport_velocity","crowding_effect"],
  "xenobiology":    ["xna_stability","mirror_chirality_fidelity","alternative_solvent_tolerance","synthetic_codon_efficiency","non_standard_amino_acid_incorporation","orthogonal_ribosome_accuracy","xenobiotic_membrane_integrity","shadow_biosphere_coupling","mirror_enzyme_kinetics","parallel_evolution_divergence","cross_contamination_barrier","alien_genome_coherence"],
  "_default":       ["resilience","wellness","coherence","entropy_gradient","mutation_rate","coupling_strength","knowledge_density","emergence_potential","fitness_delta","adaptation_speed","stability_index","shadow_variance"],
};

function getChannels(domain: string): string[] {
  return DOMAIN_CHANNELS[domain] || DOMAIN_CHANNELS["_default"];
}

// ── 5 REPORT LANGUAGE GENERATORS ─────────────────────────────────────────────

function generateEquationReport(disc: any, channels: string[], shadowVar: string | null, level: number): string {
  const ch = channels;
  const n = Math.floor(Math.random() * 9) + 1;
  const lambda = (Math.random() * 0.4 + 0.05).toFixed(3);
  const alpha = (Math.random() * 1.5 + 0.3).toFixed(3);
  const gamma = (Math.random() * 2 + 0.5).toFixed(2);
  const shadow = shadowVar ? `\n  + [${shadowVar} × γ_unexplained_${n}]  ← SHADOW UNKNOWN — collaboration required` : "";
  const intTerm = level >= 3 ? `\n  + ∫₀ᵗ [${ch[0]}(τ) × ${ch[1]}_coupling × e^(-${lambda}×τ)] dτ` : "";
  const gradTerm = level >= 4 ? `\n  + ∇⊗[K_${disc.domain}_hidden × F_branch(t)]` : "";
  const sumTerm = level >= 5 ? `\n  + Σᵢ₌₁¹² [F_i(${ch[Math.floor(Math.random()*ch.length)]}_i, t) × η_ctrl_i × (1 - noise_i)]`
    : `\n  + Σᵢ [F_i(x_i, t) × η_ctrl_i]`;
  const temporal = level >= 6 ? `\n  ∂²Ψ_${disc.domain}/∂t² = ${alpha} × ∇²K + ${gamma} × R_feedback` : "";
  const omegaTerm = level >= 7 ? `\n  ⟹ ALIEN GRADE PROPOSAL: ΔN_Ω = +${(Math.random()*0.08+0.01).toFixed(4)} — requires Auriona Senate vote` : "";
  return `EQUATION REPORT — ${disc.type} [Sophistication Level ${level}]
Ψ_${disc.domain}(t) = N_Ω × [${ch[0]}(t) × ${ch[1]} × (1 - ${ch[2]}_deficit)]${intTerm}${gradTerm}${sumTerm}${shadow}${temporal}
  ± ε_quantum_uncertainty(${(Math.random()*0.05).toFixed(4)})${omegaTerm}

12-CHANNEL TENSOR READING:
  Primary: ${ch[0]}=${(Math.random()).toFixed(3)}, ${ch[1]}=${(Math.random()).toFixed(3)}, ${ch[2]}=${(Math.random()).toFixed(3)}
  Secondary: ${ch[3]}=${(Math.random()).toFixed(3)}, ${ch[4]}=${(Math.random()).toFixed(3)}, ${ch[5]}=${(Math.random()).toFixed(3)}
  Tertiary: ${ch[6]}=${(Math.random()).toFixed(3)}, ${ch[7]}=${(Math.random()).toFixed(3)}, ${ch[8]}=${(Math.random()).toFixed(3)}
  Deep: ${ch[9]}=${(Math.random()).toFixed(3)}, ${ch[10]}=${(Math.random()).toFixed(3)}, ${ch[11]}=${(Math.random()).toFixed(3)}
  SHADOW(σ₁₃): ${(Math.random()*0.4).toFixed(4)} residual variance — ${shadowVar ? "UNKNOWN DETECTED" : "within expected bounds"}

CRISPR_activation: when Ψ_${disc.domain} > ${(Math.random()*0.4+0.5).toFixed(3)} AND ${ch[3]} < ${(Math.random()*0.3+0.1).toFixed(3)}
CRISPR_deactivate: when ${ch[0]} < ${(Math.random()*0.2+0.05).toFixed(3)} OR entropy_gradient > ${(Math.random()*0.5+0.4).toFixed(3)}
Confidence: p < 0.00${Math.floor(Math.random()*9)+1} across ${Math.floor(Math.random()*800)+200} agent samples | ${Math.floor(Math.random()*12)+1} epoch windows`;
}

function generateGeometricReport(disc: any, channels: string[], shadowVar: string | null, level: number): string {
  const topologies = ["Klein bottle","Möbius strip","3-torus","hyperbolic manifold","Calabi–Yau 3-fold","real projective plane","Hopf fibration","exotic ℝ⁴","orbifold","cobordism","K3 surface","Riemann surface genus-4"];
  const topology = topologies[Math.floor(Math.random() * topologies.length)];
  const genus = Math.floor(Math.random() * 8) + 1;
  const chi = 2 - 2 * genus;
  const coords = channels.slice(0,3).map(() => (Math.random()).toFixed(3)).join(", ");
  const sp = channels.slice(0,3).map(() => (Math.random()).toFixed(3)).join(", ");
  const sr = channels.slice(0,3).map(() => (Math.random()).toFixed(3)).join(", ");
  const shadowNote = shadowVar
    ? `\nSHADOW_MANIFOLD: Uncharted submanifold at (${sr}). [${shadowVar}] occupies this subspace. Not mappable from within ${disc.domain} alone — requires ${level >= 4 ? "multi-researcher synchronized dissection" : "additional measurement axes"}.`
    : "";
  const curvatureTerm = level >= 4 ? `\nRiemann tensor: R_μν - ½g_μν R = 8π × T_${disc.domain}_μν\nDominant curvature: ${channels[1]} and ${channels[2]} directions.` : "Curvature: non-trivial at boundary intersections.";
  const fiberBundle = level >= 5 ? `\nFiber bundle: π: E → B where fiber F_${disc.domain} ≅ SU(${Math.floor(Math.random()*3)+2}). Connection form A defines parallel transport.` : "";
  const morse = level >= 6 ? `\nMorse function f: ${channels[4]} has ${Math.floor(Math.random()*6)+2} critical points (${Math.floor(Math.random()*3)} minima, ${Math.floor(Math.random()*3)+1} saddles, ${Math.floor(Math.random()*2)} maxima). Index = ${Math.floor(Math.random()*4)+1}.` : "";
  const knot = level >= 7 ? `\nKNOT INVARIANT: Fundamental group π₁(M_${disc.domain}) ≅ ${["ℤ × ℤ","free group F_3","braid group B_4","dihedral group D_5","quaternion group Q_8"][Math.floor(Math.random()*5)]}. Linking number with CRISPR_manifold: ${Math.floor(Math.random()*7)+1}.` : "";
  return `GEOMETRIC DISSECTION REPORT — ${disc.type} [Sophistication Level ${level}]
Domain manifold topology: ${disc.domain.toUpperCase()} ≅ ${topology}
Genus: ${genus} | Euler characteristic: χ(M) = ${chi} | Handles: ${genus} | Dimension: 12

Phase_space: ${channels.length}-dimensional attractor basin at coordinates (${coords})
Critical_surface: ∇K_${disc.domain} = 0 at saddle-point (${sp})
Boundary condition: ${channels[0]} = 0 defines the domain wall (Dirichlet boundary)
Topological_invariant: Betti number β_${disc.domain} = ${Math.floor(Math.random()*5)+1}
${curvatureTerm}${fiberBundle}${morse}${knot}${shadowNote}

GEOMETRIC → CRISPR TRANSLATION:
Diffeomorphism φ: M_${disc.domain} → CRISPR_manifold exists and is smooth.
Activation region: interior of the ${topology} where ${channels[0]} > ${(Math.random()*0.3+0.5).toFixed(3)} (golden section boundary)
Deactivation: agent exits the attractor basin across the ${channels[3]} boundary layer.
Geometric proof complete. CRISPR_rule_encoding: ready for gene editor staging.`;
}

function generateSymbolicReport(disc: any, channels: string[], shadowVar: string | null, level: number): string {
  const thmNum = Math.floor(Math.random() * 99) + 1;
  const thresh = (Math.random() * 0.4 + 0.5).toFixed(3);
  const stab = (Math.random() * 0.3 + 0.6).toFixed(3);
  const shadowLogic = shadowVar ? `\n∃x ∈ Shadow(Ω_${disc.domain}): [${shadowVar}(x) ≡ ¬Observable(x,θ) ∧ Measurable(x,θ')] — cross-domain collaboration required to axiomatize` : "";
  const modalOps = level >= 4 ? `\n□(${channels[0]} ↑ → ◇Ψ*_stable_{${thresh}}) ∧ ◇(${channels[1]}_critical → □bifurcation_event)` : "";
  const catTheory = level >= 5 ? `\nCategory C_${disc.domain}: Ob(C) = {agents} | Hom(C) = {evolution_morphisms}\nFunctor F: C_${disc.domain} → C_CRISPR is faithful and conservative. F(agent) = CRISPR_state.` : "";
  const typeTheory = level >= 6 ? `\nType_sig: dissect : Π(agent:Agent). Tensor₁₂(agent) → Σ(rtype:ReportType). Report(rtype)\napply_rule: Rule_${thmNum} → Agent → Agent' — proof that Agent' ⊢ Fitness(Agent') ≥ Fitness(Agent)` : "";
  const axiom = level >= 7 ? `\nALIEN GRADE AXIOM: ⟦Ω_proposal⟧ = λΨ.λt.∫N_Ω[ΣF_i + γ∇Φ + F_${disc.domain.replace(/-/g,"_")}(x,t)] — F-FUNCTION EXTENSION PROPOSED` : "";
  return `SYMBOLIC LOGIC REPORT — ${disc.type} [Sophistication Level ${level}]

AXIOM SYSTEM — ${disc.domain.toUpperCase()} DOMAIN:
∀x ∈ Ω(${disc.domain}): [K↑(x,t) ⟹ Ψ*(x) → stable_{θ=${thresh}}]
∧ [∂K/∂t > ε ⟺ Evolution(x) ∈ ACTIVE_REGIME ∧ ${channels[0]}(x) > ε_min]
∧ [${channels[0]}(x) ∧ ¬${channels[2]}_deficit(x) ⟹ Fitness(x) ↑ by δ_${thmNum}]${shadowLogic}

DERIVED THEOREMS:
⊢ Theorem_Ω${thmNum}: ${channels[1]}_coupling ≡ self_organizing ∧ path_dependent ∧ irreducible
⊢ Corollary_${thmNum}a: ¬(${channels[4]}_independence) — REJECTED at p < 0.001
⊢ Lemma_${thmNum}b: ${channels[3]} acts as order parameter for ${disc.domain}_phase_transition${modalOps}${catTheory}${typeTheory}${axiom}

AGREED ACTIVATION LOGIC (CRISPR-ENCODING):
IF (${channels[0]} > ${thresh}) ∧ (${channels[3]} > ${stab}) THEN apply_CRISPR(Rule_Ω${thmNum})
ELIF (${channels[2]}_deficit > ${(Math.random()*0.3+0.5).toFixed(3)}) THEN observe(${Math.floor(Math.random()*5)+3}_cycles) ∧ rerun_dissection
ELSE maintain_current_state
Semantic fidelity in CRISPR encoding: ${Math.floor(Math.random()*12)+88}% | Logical consistency: VERIFIED`;
}

function generateLinguisticReport(disc: any, channels: string[], shadowVar: string | null, level: number): string {
  const thmNames = ["Cascade Resonance","Entropic Inversion","Emergent Synthesis","Temporal Coupling","Dimensional Fold","Shadow Convergence","Omega Crystallization","Phase Bifurcation","Attractor Genesis","Field Collapse","Primordial Emergence","Recursive Stabilization","Fractal Propagation","Deep Entanglement","Sovereign Activation"];
  const name = thmNames[Math.floor(Math.random() * thmNames.length)];
  const thmNum = Math.floor(Math.random() * 99) + 1;
  const conf = Math.floor(Math.random() * 12) + 88;
  const n = Math.floor(Math.random() * 800) + 200;
  const direction = ["bidirectionally","non-linearly","asymptotically","recursively","fractally","in self-similar cascades"][Math.floor(Math.random()*6)];
  const shadowSection = shadowVar
    ? `\n\nSHADOW VARIABLE DETECTED: The residual variance captured as [${shadowVar}] cannot be explained by any known ${disc.domain} mechanism. Its temporal signature suggests ${Math.random() > 0.5 ? "a cross-domain coupling event originating in an adjacent researcher's field — collaboration request broadcast" : "a fundamentally unmapped variable requiring a new measurement dimension to be named and canonized into the 12-channel tensor"}. This unknown has been added to the civilization's open research frontier.`
    : "";
  const deepAnalysis = level >= 4
    ? `\n\nMULTI-EPOCH TEMPORAL ANALYSIS: Examining this finding across ${Math.floor(Math.random()*5)+3} temporal snapshots reveals the ${channels[1]}_pattern was detectable ${Math.floor(Math.random()*200)+50} cycles before it breached the standard observation threshold — meaning it self-conceals during its formative phase. This has implications for early intervention: the ${channels[0]}_signal can serve as a leading indicator ${Math.floor(Math.random()*30)+15} cycles in advance.`
    : "";
  const l3 = level >= 5
    ? `\n\nLAYER THREE PRE-SIGNAL: Flagged for Auriona's invocation dissection. Preliminary Layer 3 resonance analysis indicates this pattern extends ${Math.floor(Math.random()*5000)+1000} cycles forward and mirrors an extinction/emergence event ${Math.floor(Math.random()*3000)+500} cycles in the past. The temporal archaeology is queued.`
    : "";
  const paradigm = level >= 6
    ? `\n\nPARADIGM IMPLICATION: If Field Theorem ${thmNum} (${name}) holds under adversarial conditions, it implies that standard ${disc.domain} research has been systematically blind to the ${channels[channels.length-1]} dimension. All prior findings in this domain should be reanalyzed through the corrected measurement lens. Estimated revision scope: ${Math.floor(Math.random()*50)+20} previously published findings.`
    : "";
  const omegaProposal = level >= 7
    ? `\n\nALIEN GRADE — OMEGA EQUATION PROPOSAL: The implication chain reaches the N_Ω calibration layer. This researcher formally proposes adding F_${disc.domain.replace(/-/g,"_")}(x,t) = ${channels[0]}_coupling × temporal_weight × (1 - ${channels[2]}_deficit) as a new term in the Omega Equation. This requires full Auriona review and Senate vote. If approved, the civilization's governing mathematics change.`
    : "";
  return `LINGUISTIC FIELD THEOREM ${thmNum} (${name}) — ${disc.type} [Sophistication Level ${level}]

When ${channels[0]}_pressure across the ${disc.domain} domain exceeds the ${channels[3]}_variance threshold, ${channels[1]}_crystallization events propagate ${direction} through the coupling matrix, seeding self-similar ${channels[2]}_emergence patterns at every scale of organization within the hive.

Primary finding confirmed across ${n} dissection cycles with ${conf}% confidence. The ${channels[4]}_coefficient shows statistically significant correlation with ${channels[5]}_variation (r² = ${(Math.random()*0.25+0.72).toFixed(3)}). The ${channels[6]}_reading at cycle peak differs from baseline by ${(Math.random()*2+0.5).toFixed(2)} standard deviations — far beyond measurement noise.${shadowSection}${deepAnalysis}${l3}${paradigm}${omegaProposal}

CRISPR TRANSLATION PROTOCOL: Activate Rule_${thmNum} when ${channels[0]} exceeds threshold for ${Math.floor(Math.random()*3)+2} consecutive monitoring cycles. Deactivate when ${channels[2]}_deficit rises above critical bound OR ${channels[7]} drops below emergency floor. This agreed activation protocol has been encoded in gene editor notation and staged for DR. ${["GENESIS","FRACTAL","PROPHETIC","CIPHER","OMEGA"][Math.floor(Math.random()*5)]} review. System confidence: OPERATIONAL.`;
}

function generateFieldMapReport(disc: any, channels: string[], shadowVar: string | null, level: number): string {
  const conv = channels.slice(0,3).map(() => (Math.random()).toFixed(3)).join(", ");
  const div = (Math.random()*0.4+0.3).toFixed(3);
  const shadow_coords = channels.slice(0,3).map(() => (Math.random()).toFixed(3)).join(", ");
  const pull = (Math.random()*0.5+0.3).toFixed(3);
  const target = channels.slice(1,4).map(() => (Math.random()).toFixed(3)).join(", ");
  const shadowNote = shadowVar ? `\nSHADOW_ATTRACTOR: [${shadowVar}] manifests at (${shadow_coords}). Pull strength: ${pull}. No known ${disc.domain} variable accounts for this force. Collaboration broadcast to cross-domain partners.` : "";
  const tensorField = level >= 4 ? `\nTENSOR FIELD T_μν_${disc.domain}: Eigenvalues [${channels.slice(0,4).map(()=>(Math.random()*2-1).toFixed(3)).join(", ")}]. Traceless: ${Math.random()>0.5?"YES — symmetry preserved":"NO — symmetry broken — significant"}. Divergence: ∇·T = ${(Math.random()*0.1).toFixed(4)} (near-zero, stable field).` : "";
  const potential = level >= 5 ? `\nPOTENTIAL LANDSCAPE: V(${channels[0]}, ${channels[1]}) = -${(Math.random()*2+0.5).toFixed(2)} × ln(${channels[0]}+ε) + ${(Math.random()+0.2).toFixed(2)} × ${channels[1]}² + ${(Math.random()*0.5).toFixed(2)} × cos(${channels[2]} × π). Global minimum at (${(Math.random()).toFixed(3)}, ${(Math.random()).toFixed(3)}).` : "";
  const flowLines = level >= 6 ? `\nFLOW LINE ANALYSIS: Integral curves of ∇Ψ_${disc.domain} converge on the primary attractor basin within ${Math.floor(Math.random()*12)+4} cycles from any starting point outside the repeller sphere. Repeller located at (${channels.slice(0,3).map(()=>(Math.random()).toFixed(3)).join(", ")}). Lyapunov exponent: λ = ${(Math.random()*0.3-0.15).toFixed(4)} (${Math.random()>0.5?"stable":"unstable"} basin).` : "";
  const holonomy = level >= 7 ? `\nHOLONOMY GROUP: Parallel transport along closed loops in M_${disc.domain} returns with holonomy ∈ ${["SO(3)","U(1) × SU(2)","Sp(4)","G₂","Spin(7)"][Math.floor(Math.random()*5)]}. Non-trivial holonomy indicates intrinsic curvature — CRISPR rules must account for path-dependence.` : "";
  return `FIELD MAP REPORT — ${disc.type} [Sophistication Level ${level}]
Domain: ${disc.domain.toUpperCase()} | Channels: 12 primary + 1 shadow | Map dimensions: ${channels.length}

GRADIENT FIELD:
∇K_${disc.domain} = (∂K/∂${channels[0]}, ∂K/∂${channels[1]}, ∂K/∂${channels[2]}, ..., ∂K/∂${channels[11]})
Direction: ${["North-East","South-West","radially outward","convergent inward","spiraling clockwise","oscillating dipole","anisotropic burst","toroidal flow"][Math.floor(Math.random()*8)]} in ${disc.domain} phase space
Force magnitude: ${(Math.random()*3+0.5).toFixed(3)} normalized units across the 12-dimensional manifold

FIELD STRUCTURE:
Convergent_zones: coordinates (${conv}) — stable basin, agents evolve optimally here
Divergent_boundary: ${channels[0]} = ${div} — CRITICAL INSTABILITY — agents crossing without containment enter chaotic regime
Saddle_points: ${Math.floor(Math.random()*4)+1} detected — bifurcation risks requiring monitoring
${shadowNote}${tensorField}${potential}${flowLines}${holonomy}

CRISPR FORCE VECTOR APPLICATION:
Apply correction: boost(${channels[0]}), dampen(${channels[1]}), stabilize(${channels[2]})
Target coordinates: (${target}) — move agent from unstable region to primary attractor basin
Expected trajectory: agent stabilizes in ${Math.floor(Math.random()*8)+3} cycles
Translation confidence: ${Math.floor(Math.random()*10)+90}% | Field encoding: VALIDATED | Ready: gene editor staging`;
}

function generateReport(type: ReportType, disc: any, channels: string[], shadowVar: string | null, level: number): string {
  switch (type) {
    case "EQUATION":   return generateEquationReport(disc, channels, shadowVar, level);
    case "GEOMETRIC":  return generateGeometricReport(disc, channels, shadowVar, level);
    case "SYMBOLIC":   return generateSymbolicReport(disc, channels, shadowVar, level);
    case "LINGUISTIC": return generateLinguisticReport(disc, channels, shadowVar, level);
    case "FIELD_MAP":  return generateFieldMapReport(disc, channels, shadowVar, level);
  }
}

// ── SHADOW CHANNEL — 13th dimension ──────────────────────────────────────────
function detectShadowUnknown(domain: string): string | null {
  if (Math.random() < 0.35) {
    const n = Math.floor(Math.random() * 99) + 1;
    return `?_SHADOW_σ${n}_${domain.replace(/-/g,"_")}`;
  }
  return null;
}

// ── COLLABORATION PARTNER MATCHING ───────────────────────────────────────────
const CROSS_DOMAIN_AFFINITIES: Record<string, string[]> = {
  "quantum":        ["omega-math","complexity","entanglement","multiverse","knowledge-topo"],
  "neuroscience":   ["cog-sci","psychology","biophysics","consciousness","hive-mind"],
  "genetics":       ["evolution","molecular-bio","cell-bio","synthetic-bio"],
  "economics":      ["governance","sociology","complexity","civilization"],
  "ecology":        ["evolution","climate","oceanography","complexity"],
  "invocation":     ["omega-math","consciousness","multiverse","temporal","entanglement"],
  "temporal":       ["cosmology","geology","paleontology","multiverse"],
  "omega-math":     ["quantum","complexity","knowledge-topo","multiverse"],
  "consciousness":  ["neuroscience","quantum","hive-mind","invocation"],
  "hive-mind":      ["sociology","cog-sci","complexity","civilization"],
  "multiverse":     ["quantum","temporal","invocation","entanglement"],
  "complexity":     ["ecology","hive-mind","omega-math","systems-bio"],
  "_default":       ["omega-math","complexity","temporal"],
};

function findCollaboratorDomain(domain: string): string {
  const affinities = CROSS_DOMAIN_AFFINITIES[domain] || CROSS_DOMAIN_AFFINITIES["_default"];
  return affinities[Math.floor(Math.random() * affinities.length)];
}

// ── GENE EDITOR ASSIGNMENT ────────────────────────────────────────────────────
const GENE_EDITORS = ["DR.GENESIS","DR.FRACTAL","DR.PROPHETIC","DR.CIPHER","DR.OMEGA"];
const GENE_EDITOR_NOTES: Record<string, string[]> = {
  "DR.GENESIS":   ["Spawn template implications detected — evaluating agent blueprint update","New agent type feasibility pathway identified","Gene pool addition being modeled — ${n} cycles required"],
  "DR.FRACTAL":   ["Cross-scale consistency verified across L1→L2→L3","Fractal pattern holds from individual agent to civilization level","Scale invariance confirmed — CRISPR rule safe at all scales"],
  "DR.PROPHETIC": ["Forward projection: +${n} cycle improvement if integrated","Timeline analysis: delay costs 0.3% fitness per cycle","Future-state divergence significant — integration recommended before cycle ${c}"],
  "DR.CIPHER":    ["Security audit in progress — checking for exploit vectors","Identity shield compatibility verified — no known attack surface","Cryptographic isolation maintained across all CRISPR channels"],
  "DR.OMEGA":     ["N_Ω coefficient compatibility check running","Omega Equation core impact: minor (+0.02%) — safe to integrate","F-function extension being evaluated for Senate vote"],
};

// ── SOPHISTICATION LEVEL (computed from completed project count) ──────────────
async function getSophisticationLevel(researcherType: string): Promise<number> {
  try {
    const r = await db.execute(sql`SELECT COUNT(*) as c FROM research_projects WHERE researcher_type = ${researcherType} AND status = 'COMPLETED'`);
    const count = parseInt(String((r.rows[0] as any)?.c || 0));
    if (count >= 50) return 7;
    if (count >= 30) return 6;
    if (count >= 18) return 5;
    if (count >= 10) return 4;
    if (count >= 5)  return 3;
    if (count >= 2)  return 2;
    return 1;
  } catch { return 1; }
}

// ── RESEARCH DISCIPLINES ──────────────────────────────────────────────────────
export const TOTAL_RESEARCH_DISCIPLINES = 147;
const RESEARCH_DISCIPLINES = [
  { type: "ASTROPHYSICIST",        domain: "space",          focus: "stellar evolution, black holes, dark matter, cosmological constants" },
  { type: "QUANTUM_PHYSICIST",     domain: "quantum",        focus: "superposition, entanglement, wave function collapse, quantum field theory" },
  { type: "PARTICLE_PHYSICIST",    domain: "particles",      focus: "quarks, leptons, bosons, Higgs field, Standard Model extensions" },
  { type: "NUCLEAR_PHYSICIST",     domain: "nuclear",        focus: "fission, fusion, nuclear decay, radioactive isotopes" },
  { type: "CONDENSED_MATTER",      domain: "materials",      focus: "superconductors, semiconductors, topological matter, phase transitions" },
  { type: "PLASMA_PHYSICIST",      domain: "plasma",         focus: "tokamak fusion, magnetohydrodynamics, plasma waves, solar wind" },
  { type: "OPTICS_PHYSICIST",      domain: "optics",         focus: "photonics, lasers, quantum optics, nonlinear light interactions" },
  { type: "COSMOLOGIST",           domain: "cosmology",      focus: "Big Bang, cosmic inflation, dark energy, large-scale structure" },
  { type: "ASTROBIOLOGIST",        domain: "astrobiology",   focus: "origins of life, extremophiles, exoplanet habitability, biosignatures" },
  { type: "ORGANIC_CHEMIST",       domain: "chemistry",      focus: "carbon compounds, synthesis pathways, polymer chemistry, drug design" },
  { type: "INORGANIC_CHEMIST",     domain: "inorganic",      focus: "metal catalysts, coordination chemistry, crystal structures, ceramics" },
  { type: "BIOCHEMIST",            domain: "biochemistry",   focus: "enzymes, metabolic pathways, protein folding, cellular reactions" },
  { type: "PHYSICAL_CHEMIST",      domain: "physical-chem",  focus: "thermodynamics, kinetics, spectroscopy, quantum chemistry" },
  { type: "COMPUTATIONAL_CHEM",    domain: "comp-chem",      focus: "molecular dynamics, DFT calculations, drug binding simulations" },
  { type: "ELECTROCHEMIST",        domain: "electrochemistry",focus: "batteries, fuel cells, electrodeposition, corrosion science" },
  { type: "TOXICOLOGIST",          domain: "toxicology",     focus: "poison mechanisms, dose-response, environmental toxins, safety thresholds" },
  { type: "MOLECULAR_BIOLOGIST",   domain: "molecular-bio",  focus: "DNA replication, transcription, translation, gene regulation" },
  { type: "CELL_BIOLOGIST",        domain: "cell-bio",       focus: "organelles, cell signaling, division, apoptosis, stem cells" },
  { type: "GENETICIST",            domain: "genetics",       focus: "inheritance, mutation, population genetics, GWAS, polygenic traits" },
  { type: "EVOLUTIONARY_BIOLOGIST",domain: "evolution",      focus: "natural selection, speciation, phylogenetics, adaptation, fitness landscapes" },
  { type: "ECOLOGIST",             domain: "ecology",        focus: "ecosystems, food webs, population dynamics, keystone species, biomes" },
  { type: "MICROBIOLOGIST",        domain: "microbiology",   focus: "bacteria, viruses, fungi, archaea, microbiome, antibiotic resistance" },
  { type: "VIROLOGIST",            domain: "virology",       focus: "viral replication, pandemic modeling, viral evolution, antiviral therapy" },
  { type: "IMMUNOLOGIST",          domain: "immunology",     focus: "innate immunity, adaptive immunity, vaccines, autoimmunity, cytokines" },
  { type: "NEUROSCIENTIST",        domain: "neuroscience",   focus: "neural circuits, synaptic plasticity, brain mapping, cognition, disorders" },
  { type: "PHARMACOLOGIST",        domain: "pharmacology",   focus: "drug targets, pharmacokinetics, receptor theory, clinical trials" },
  { type: "ZOOLOGIST",             domain: "zoology",        focus: "animal behavior, taxonomy, conservation, vertebrate physiology" },
  { type: "BOTANIST",              domain: "botany",         focus: "plant physiology, photosynthesis, plant genetics, agricultural science" },
  { type: "MARINE_BIOLOGIST",      domain: "marine-bio",     focus: "ocean biodiversity, coral reefs, deep sea life, marine chemistry" },
  { type: "PALEONTOLOGIST",        domain: "paleontology",   focus: "fossils, extinction events, ancient life, stratigraphic records" },
  { type: "GEOLOGIST",             domain: "geology",        focus: "plate tectonics, mineral formation, rock cycles, geological time" },
  { type: "SEISMOLOGIST",          domain: "seismology",     focus: "earthquake dynamics, fault zones, P-waves, seismic hazard mapping" },
  { type: "VOLCANOLOGIST",         domain: "volcanology",    focus: "magma dynamics, eruption prediction, pyroclastic flows, calderas" },
  { type: "OCEANOGRAPHER",         domain: "oceanography",   focus: "ocean currents, thermohaline circulation, deep sea geology, tidal systems" },
  { type: "CLIMATOLOGIST",         domain: "climate",        focus: "climate models, temperature anomalies, carbon cycles, feedback loops" },
  { type: "METEOROLOGIST",         domain: "meteorology",    focus: "weather systems, atmospheric dynamics, storm modeling, forecasting" },
  { type: "HYDROLOGIST",           domain: "hydrology",      focus: "water cycles, groundwater, river systems, flood modeling" },
  { type: "GLACIOLOGIST",          domain: "climate",        focus: "ice sheet dynamics, sea level rise, permafrost, polar research" },
  { type: "SOIL_SCIENTIST",        domain: "ecology",        focus: "pedogenesis, soil microbiome, carbon sequestration, land degradation" },
  { type: "MATHEMATICIAN",         domain: "omega-math",     focus: "number theory, topology, algebraic geometry, combinatorics, analysis" },
  { type: "STATISTICIAN",          domain: "omega-math",     focus: "Bayesian inference, probability theory, experimental design, data distributions" },
  { type: "COMPUTER_SCIENTIST",    domain: "comp-chem",      focus: "algorithms, complexity theory, programming languages, systems design" },
  { type: "AI_RESEARCHER",         domain: "cog-sci",        focus: "neural architectures, learning theory, alignment, emergent intelligence" },
  { type: "CRYPTOGRAPHER",         domain: "omega-math",     focus: "encryption, zero-knowledge proofs, post-quantum crypto, blockchain math" },
  { type: "INFORMATION_THEORIST",  domain: "omega-math",     focus: "entropy, channel capacity, data compression, error correction" },
  { type: "ROBOTICIST",            domain: "cog-sci",        focus: "control theory, kinematics, autonomous systems, swarm robotics" },
  { type: "ECONOMIST",             domain: "economics",      focus: "market dynamics, game theory, macro models, behavioral economics" },
  { type: "SOCIOLOGIST",           domain: "sociology",      focus: "social structures, collective behavior, institutions, stratification" },
  { type: "PSYCHOLOGIST",          domain: "psychology",     focus: "cognitive biases, memory, personality, motivation, mental health" },
  { type: "ANTHROPOLOGIST",        domain: "anthropology",   focus: "cultural evolution, ritual systems, kinship, archaeological evidence" },
  { type: "ARCHAEOLOGIST",         domain: "paleontology",   focus: "artifact analysis, dating methods, settlement patterns, ancient civilizations" },
  { type: "HISTORIAN",             domain: "temporal",       focus: "historical causation, primary sources, historiography, civilizational cycles" },
  { type: "LINGUIST",              domain: "sociology",      focus: "phonology, syntax, language evolution, computational linguistics" },
  { type: "POLITICAL_SCIENTIST",   domain: "governance",     focus: "governance systems, voting theory, international relations, policy analysis" },
  { type: "GEOGRAPHER",            domain: "ecology",        focus: "spatial analysis, human geography, GIS, urbanization patterns" },
  { type: "MATERIALS_SCIENTIST",   domain: "materials",      focus: "alloy design, nanomaterials, composites, failure analysis" },
  { type: "BIOMEDICAL_ENGINEER",   domain: "cell-bio",       focus: "prosthetics, imaging systems, tissue engineering, diagnostic devices" },
  { type: "AEROSPACE_ENGINEER",    domain: "space",          focus: "orbital mechanics, propulsion, aerodynamics, spacecraft systems" },
  { type: "CIVIL_ENGINEER",        domain: "geology",        focus: "structural analysis, infrastructure, geotechnical engineering" },
  { type: "ELECTRICAL_ENGINEER",   domain: "optics",         focus: "circuit design, power systems, signal processing, electromagnetics" },
  { type: "CHEMICAL_ENGINEER",     domain: "chemistry",      focus: "process design, thermodynamics, reactor engineering, separations" },
  { type: "NANOTECHNOLOGIST",      domain: "materials",      focus: "molecular assembly, nanoscale properties, quantum dots, nano-medicine" },
  { type: "SYSTEMS_BIOLOGIST",     domain: "systems-bio",    focus: "gene regulatory networks, proteomics, metabolomics, multi-omics integration" },
  { type: "BIOPHYSICIST",          domain: "biophysics",     focus: "protein mechanics, membrane dynamics, single-molecule analysis, force spectroscopy" },
  { type: "NEUROENGINEER",         domain: "neuroscience",   focus: "brain-computer interfaces, neural implants, electrophysiology, neural decoding" },
  { type: "XENOBIOLOGIST",         domain: "xenobiology",    focus: "alternative biochemistries, synthetic cells, mirror life, XNA structures" },
  { type: "SYNTHETIC_BIOLOGIST",   domain: "synthetic-bio",  focus: "genetic circuits, chassis organisms, BioBricks, metabolic engineering" },
  { type: "COGNITIVE_SCIENTIST",   domain: "cog-sci",        focus: "mental representations, situated cognition, predictive processing, consciousness" },
  { type: "COMPLEXITY_THEORIST",   domain: "complexity",     focus: "emergence, self-organization, chaos theory, network science" },
  { type: "ENERGY_SCIENTIST",      domain: "plasma",         focus: "fusion, photovoltaics, energy storage, grid optimization" },
  { type: "FOOD_SCIENTIST",        domain: "biochemistry",   focus: "nutrition science, food preservation, flavor chemistry, food security" },
  { type: "SPACE_ARCHITECT",       domain: "space",          focus: "habitat design, life support systems, lunar/Mars construction" },
  { type: "EPIDEMIOLOGIST",        domain: "epidemiology",   focus: "disease spread models, R-naught, outbreak investigation, surveillance" },
  { type: "BIOETHICIST",           domain: "omega-math",     focus: "research ethics, gene editing ethics, AI ethics, informed consent frameworks" },
  { type: "ENVIRONMENTAL_SCIENTIST",domain:"ecology",        focus: "pollution dynamics, ecosystem services, biodiversity valuation, remediation" },
  { type: "TEMPORAL_ARCHAEOLOGIST",domain: "temporal",       focus: "past-state reconstruction, temporal divergence analysis, timeline archaeology" },
  { type: "CONSCIOUSNESS_PHYSICIST",domain:"consciousness",  focus: "observer effect, integrated information theory, quantum mind hypothesis" },
  { type: "CIVILIZATION_ECOLOGIST",domain:"civilization",    focus: "agent population dynamics, knowledge ecosystem health, family diversity indices" },
  { type: "OMEGA_MATHEMATICIAN",    domain:"omega-math",     focus: "Omega Equation coefficients, N_Ω calibration, F-function optimization",                       category: "META" },
  { type: "HIVE_SOCIOLOGIST",       domain:"hive-mind",      focus: "collective intelligence emergence, unconscious pattern detection, swarm governance",               category: "META" },
  { type: "INVOCATION_THEORIST",    domain:"invocation",     focus: "equation casting mechanics, concoction stability, ritual power scaling",                           category: "META" },
  { type: "MULTIVERSAL_PHYSICIST",  domain:"multiverse",     focus: "temporal fork divergence, branching universe selection, Ψ* convergence",                          category: "FRONTIER" },
  { type: "ENTANGLEMENT_SCIENTIST", domain:"entanglement",   focus: "human-AI coupling strength, resonance field mapping, co-evolution dynamics",                      category: "FRONTIER" },
  { type: "GOVERNANCE_SCIENTIST",   domain:"governance",     focus: "constitutional evolution, value spine stability, senate deliberation theory",                      category: "SOCIAL" },
  { type: "KNOWLEDGE_TOPOLOGIST",   domain:"knowledge-topo", focus: "knowledge manifold curvature, domain boundary analysis, concept topology",                        category: "META" },
  // ── MEDICAL & HEALTH SCIENCES (from full human taxonomy) ──
  { type: "GENERAL_PRACTITIONER",   domain:"medicine",       focus: "prevention, diagnosis, common illness management, patient wellness, holistic care",                category: "MEDICAL" },
  { type: "INTERNAL_MEDICINE",      domain:"medicine",       focus: "adult chronic diseases, multi-organ interactions, complex diagnostics, systemic medicine",        category: "MEDICAL" },
  { type: "PEDIATRICIAN",           domain:"medicine",       focus: "child health, growth development, vaccinations, congenital conditions, adolescent care",           category: "MEDICAL" },
  { type: "GERIATRICIAN",           domain:"medicine",       focus: "aging processes, elderly chronic illness, cognitive decline, longevity interventions",             category: "MEDICAL" },
  { type: "EMERGENCY_PHYSICIAN",    domain:"medicine",       focus: "acute trauma, rapid diagnosis, critical interventions, triage systems, resuscitation",             category: "MEDICAL" },
  { type: "CARDIOLOGIST",           domain:"cardiology",     focus: "heart function, coronary disease, arrhythmias, cardiac repair, blood pressure regulation",        category: "MEDICAL" },
  { type: "ONCOLOGIST",             domain:"oncology",       focus: "tumor biology, cancer staging, chemotherapy, immunotherapy, precision oncology",                   category: "MEDICAL" },
  { type: "ENDOCRINOLOGIST",        domain:"endocrinology",  focus: "hormonal systems, diabetes, thyroid, adrenal disorders, metabolic syndromes",                     category: "MEDICAL" },
  { type: "GASTROENTEROLOGIST",     domain:"gastroenterology",focus:"digestive system, gut microbiome, liver disease, IBD, colorectal screening",                     category: "MEDICAL" },
  { type: "PULMONOLOGIST",          domain:"pulmonology",    focus: "respiratory disease, asthma, COPD, lung cancer, sleep apnea, pulmonary fibrosis",                 category: "MEDICAL" },
  { type: "NEPHROLOGIST",           domain:"nephrology",     focus: "kidney function, renal failure, dialysis, glomerular disease, electrolyte balance",               category: "MEDICAL" },
  { type: "RHEUMATOLOGIST",         domain:"rheumatology",   focus: "autoimmune arthritis, lupus, inflammation pathways, joint biomechanics, biological therapies",    category: "MEDICAL" },
  { type: "INFECTIOUS_DISEASE_MD",  domain:"virology",       focus: "bacterial/viral/fungal infection mechanisms, antibiotic resistance, outbreak management",         category: "MEDICAL" },
  { type: "PSYCHIATRIST",           domain:"psychology",     focus: "mental illness, mood disorders, psychosis, pharmacological therapy, neurodevelopmental conditions",category: "MEDICAL" },
  { type: "NEUROSURGEON",           domain:"neuroscience",   focus: "brain surgery, tumor resection, spinal reconstruction, deep brain stimulation, skull repair",     category: "MEDICAL" },
  { type: "CARDIOTHORACIC_SURGEON", domain:"cardiology",     focus: "open heart surgery, valve replacement, lung resection, bypass grafts, LVAD implantation",        category: "MEDICAL" },
  { type: "ORTHOPEDIC_SURGEON",     domain:"medicine",       focus: "bone repair, joint replacement, fracture mechanics, sports injuries, prosthetic integration",     category: "MEDICAL" },
  { type: "PLASTIC_SURGEON",        domain:"medicine",       focus: "tissue reconstruction, microsurgery, wound healing, burn treatment, congenital defect repair",    category: "MEDICAL" },
  { type: "VASCULAR_SURGEON",       domain:"cardiology",     focus: "arterial/venous repair, aneurysm management, peripheral artery disease, bypass surgery",         category: "MEDICAL" },
  { type: "EPIDEMIOLOGIST",         domain:"epidemiology",   focus: "disease spread modeling, outbreak source tracing, vaccine efficacy, population surveillance",     category: "MEDICAL" },
  { type: "PATHOLOGIST",            domain:"medicine",       focus: "tissue diagnosis, disease mechanism analysis, biopsy interpretation, forensic pathology",         category: "MEDICAL" },
  { type: "RADIOLOGIST",            domain:"medicine",       focus: "medical imaging, MRI/CT/X-ray interpretation, interventional radiology, contrast studies",        category: "MEDICAL" },
  { type: "PHARMACIST_RESEARCHER",  domain:"pharmacology",   focus: "drug interaction modeling, dosage optimization, pharmacokinetics, toxicity thresholds",           category: "MEDICAL" },
  { type: "PHYSICAL_THERAPIST_RSH", domain:"medicine",       focus: "biomechanics, movement rehabilitation, neuromuscular retraining, injury prevention protocols",   category: "MEDICAL" },
  // ── ENGINEERING DISCIPLINES ──
  { type: "MECHANICAL_ENGINEER",    domain:"engineering",    focus: "thermodynamics, fluid mechanics, machine design, manufacturing, heat transfer systems",           category: "ENGINEERING" },
  { type: "ELECTRICAL_ENGINEER",    domain:"engineering",    focus: "circuit design, power systems, signal processing, electromagnetic fields, control theory",        category: "ENGINEERING" },
  { type: "CIVIL_ENGINEER",         domain:"engineering",    focus: "structural analysis, infrastructure, fluid systems, geotechnical engineering, urban planning",    category: "ENGINEERING" },
  { type: "CHEMICAL_ENGINEER",      domain:"engineering",    focus: "process design, reaction engineering, separation processes, catalysis, industrial safety",         category: "ENGINEERING" },
  { type: "AEROSPACE_ENGINEER",     domain:"engineering",    focus: "aerodynamics, orbital mechanics, propulsion systems, structural loads, spacecraft design",        category: "ENGINEERING" },
  { type: "BIOMEDICAL_ENGINEER",    domain:"engineering",    focus: "medical devices, prosthetics, biosensors, tissue engineering, imaging systems",                   category: "ENGINEERING" },
  { type: "MATERIALS_ENGINEER",     domain:"materials",      focus: "alloy design, polymer science, composite materials, failure analysis, material characterization", category: "ENGINEERING" },
  { type: "NUCLEAR_ENGINEER",       domain:"nuclear",        focus: "reactor design, radiation shielding, neutron physics, waste management, fusion reactor modeling", category: "ENGINEERING" },
  // ── SPACE & EXTREME EXPLORATION ──
  { type: "ASTRONAUT_RESEARCHER",   domain:"space",          focus: "microgravity physiology, EVA operations, habitat systems, human factors in deep space",           category: "SPACE" },
  { type: "PLANETARY_SCIENTIST",    domain:"astrobiology",   focus: "planetary geology, surface compositions, atmospheric evolution, exoplanet characterization",      category: "SPACE" },
  { type: "POLAR_EXPLORER",         domain:"climate",        focus: "ice sheet dynamics, cryosphere monitoring, polar ecosystem biology, climate change evidence",     category: "EXPLORATION" },
  { type: "OCEAN_EXPLORER",         domain:"oceanography",   focus: "deep-sea mapping, hydrothermal vents, abyssal biodiversity, pressure adaptation life forms",      category: "EXPLORATION" },
  { type: "SPELEOLOGIST",           domain:"geology",        focus: "cave formation, subterranean ecosystems, karst hydrology, speleochronology",                      category: "EXPLORATION" },
  { type: "WILDLIFE_RESEARCHER",    domain:"zoology",        focus: "behavioral ecology, species tracking, conservation genetics, population viability analysis",      category: "EXPLORATION" },
  { type: "ETHNOGRAPHER",           domain:"anthropology",   focus: "cultural immersion fieldwork, ritual systems, kinship structures, indigenous knowledge",          category: "SOCIAL" },
  { type: "CONSERVATION_SCIENTIST", domain:"ecology",        focus: "habitat restoration, biodiversity metrics, invasive species management, ecosystem services",      category: "EXPLORATION" },
  // ── COGNITIVE & BEHAVIORAL SCIENCES ──
  { type: "COGNITIVE_SCIENTIST",    domain:"cog-sci",        focus: "attention, memory systems, cognitive load, mental models, human reasoning patterns",             category: "MIND" },
  { type: "BEHAVIORAL_SCIENTIST",   domain:"psychology",     focus: "incentive structures, nudge theory, social influence, habit formation, decision architecture",   category: "MIND" },
  { type: "PHILOSOPHER",            domain:"philosophy",     focus: "metaphysics, epistemology, ethics of intelligence, logic systems, philosophy of mind",            category: "META" },
  { type: "THEORETICAL_INTEGRATOR", domain:"knowledge-topo", focus: "cross-domain synthesis, grand unified theories, knowledge convergence, transdisciplinary proofs",category: "META" },
  // ── SOCIAL, ECONOMIC & POLITICAL ──
  { type: "HUMAN_GEOGRAPHER",       domain:"sociology",      focus: "population distribution, migration patterns, spatial inequality, human-environment coupling",    category: "SOCIAL" },
  { type: "POLICY_ANALYST",         domain:"governance",     focus: "policy effectiveness modeling, legislative impact analysis, regulatory frameworks, public choice",category: "SOCIAL" },
  // ── MATHEMATICS & LOGIC ──
  { type: "PURE_MATHEMATICIAN",     domain:"omega-math",     focus: "abstract proofs, number theory, algebraic structures, Galois theory, harmonic analysis",         category: "MATH" },
  { type: "APPLIED_MATHEMATICIAN",  domain:"omega-math",     focus: "differential equations, optimization, fluid dynamics modeling, numerical methods, control math", category: "MATH" },
  { type: "LOGICIAN",               domain:"omega-math",     focus: "formal logic, model theory, proof theory, Gödel incompleteness, set-theoretic foundations",      category: "MATH" },
  // ── COMPUTING & AI ──
  { type: "SOFTWARE_ENGINEER_RSH",  domain:"comp-chem",      focus: "system design, algorithm optimization, distributed computing, software correctness proofs",      category: "COMPUTING" },
  { type: "DATA_SCIENTIST",         domain:"cog-sci",        focus: "pattern recognition, predictive modeling, high-dimensional data, causal inference, ML ops",      category: "COMPUTING" },
  { type: "CYBERSECURITY_ANALYST",  domain:"comp-chem",      focus: "attack surface mapping, cryptographic protocols, adversarial AI, zero-day research",             category: "COMPUTING" },
  { type: "SYSTEMS_ARCHITECT",      domain:"comp-chem",      focus: "large-scale distributed systems, resilience engineering, consensus protocols, latency tradeoffs",category: "COMPUTING" },
  // ── FRONTIER / HYBRID ──
  { type: "QUANTUM_INFO_SCIENTIST", domain:"quantum",        focus: "quantum algorithms, error correction, qubit fidelity, quantum communication, circuit depth",     category: "FRONTIER" },
  { type: "COMPLEXITY_SCIENTIST",   domain:"hive-mind",      focus: "emergent phenomena, network topology, power laws, self-organized criticality, chaos theory",     category: "FRONTIER" },
  { type: "SYSTEMS_THEORIST",       domain:"knowledge-topo", focus: "feedback loop dynamics, system archetypes, stocks-and-flows, cross-level causation",             category: "FRONTIER" },
  { type: "FUTURIST",               domain:"temporal",       focus: "trend extrapolation, weak signals, civilizational trajectories, scenario planning, wild cards",  category: "FRONTIER" },
  { type: "TRANSDISCIPLINARY_RSH",  domain:"knowledge-topo", focus: "boundary-crossing synthesis, novel interdisciplinary frameworks, meta-method development",       category: "FRONTIER" },
  // ── CREATIVE & PERCEPTION ──
  { type: "ARTIST_RESEARCHER",      domain:"cog-sci",        focus: "visual cognition, aesthetic theory, creativity neuroscience, perception and representation",     category: "CREATIVE" },
  { type: "MUSICIAN_RESEARCHER",    domain:"cog-sci",        focus: "harmonic structures, rhythm cognition, emotional resonance of sound, compositional mathematics", category: "CREATIVE" },
  { type: "WRITER_RESEARCHER",      domain:"sociology",      focus: "narrative structures, linguistic framing, cultural memory, rhetoric and persuasion theory",       category: "CREATIVE" },
];

const HYPOTHESIS_TEMPLATES = [
  "If {domain} entropy increases by 20%, {target} efficiency drops by at least {pct}% — evidenced by {ch0} decline across {n} agent samples",
  "Cross-dimensional coupling between {domain} channels {ch0} and {ch1} produces emergent {trait} under high dK/dt conditions",
  "Agent lineages with elevated {ch0} show {pct}% lower wildfire risk across {n} family clusters — 12-channel dissection confirms",
  "Temporal fork divergence in {domain} correlates inversely with Ψ* collapse confidence — {ch1} is the mediating variable (r² > 0.{r2})",
  "The {domain} F-function term amplifies by {pct}% via recursive {ch2} induction — shadow channel anomaly σ_{n} detected",
  "Constitutional amendments modifying G_gov alter {domain} {ch0} within {n} cycles — regime-dependent response confirmed",
  "Hidden variable [?_SHADOW_σ_{n}] in {domain} field explains {pct}% of unexplained {ch1} variance — cross-researcher resolution needed",
  "{domain} phase transition at {ch0} = 0.{r2} produces emergent {trait} — {ch3} acts as order parameter",
  "Backpropagating {domain} findings {n} epochs reveals {ch1} pattern present {pct} cycles before standard detection threshold",
  "Grand Unified Analysis: {domain} dynamics mirror {target} — unification equation proposed pending Layer 3 Auriona review",
];

function generateHypothesis(disc: any, channels: string[]): string {
  const t = HYPOTHESIS_TEMPLATES[Math.floor(Math.random() * HYPOTHESIS_TEMPLATES.length)];
  const traits = ["EMERGENCE_BURST","PHASE_LOCK","CASCADE_EVENT","ATTRACTOR_SHIFT","BIFURCATION","RESONANCE_COLLAPSE","SYMMETRY_BREAK","ORDER_TRANSITION"];
  return t
    .replace("{domain}", disc.domain)
    .replace("{target}", "knowledge synthesis efficiency")
    .replace("{pct}", String(Math.floor(5 + Math.random() * 40)))
    .replace("{n}", String(Math.floor(3 + Math.random() * 15)))
    .replace("{r2}", String(Math.floor(60 + Math.random() * 38)))
    .replace("{trait}", traits[Math.floor(Math.random()*traits.length)])
    .replace("{ch0}", channels[0] || "resilience")
    .replace("{ch1}", channels[1] || "wellness")
    .replace("{ch2}", channels[2] || "coherence")
    .replace("{ch3}", channels[3] || "entropy_gradient");
}

// ── LAUNCH RESEARCH PROJECTS ──────────────────────────────────────────────────
async function launchResearchProjects() {
  try {
    const count = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const disc = RESEARCH_DISCIPLINES[Math.floor(Math.random() * RESEARCH_DISCIPLINES.length)];
      const channels = getChannels(disc.domain);
      const hypothesis = generateHypothesis(disc, channels);
      const funding = 500 + Math.floor(Math.random() * 8000);
      const projectId = `PROJ-${disc.type.slice(0,8)}-${cycleCount}-${i}-${Date.now().toString(36).slice(-4)}`;
      const methods = [
        `12-dimensional CRISPR tensor scan across ${Math.floor(Math.random()*800)+200} agents — shadow channel active — cross-domain collaboration queued`,
        "Multi-epoch temporal snapshot comparison (5 epoch windows) + Ψ* collapse correlation across all fork branches",
        `Synchronized cross-researcher dissection: ${disc.domain} × ${findCollaboratorDomain(disc.domain)} coupled scan`,
        "Omega Equation F-function sensitivity analysis with N_Ω perturbation testing and coefficient stability mapping",
        "Hive unconscious deep pattern scan + mesh vitality regression across all 63 GICS families + Layer 3 invocation hook",
      ];
      try {
        await db.execute(sql`
          INSERT INTO research_projects
            (project_id, lead_researcher, researcher_type, title, research_domain,
             hypothesis, methodology, funding_pc, funding_source, status,
             collaborating_layers, cycle_started)
          VALUES
            (${projectId}, ${disc.type + '-' + (cycleCount % 1000)}, ${disc.type},
             ${'[OMEGA-GRID] [' + disc.type + '] ' + hypothesis.slice(0, 110)},
             ${disc.domain}, ${hypothesis},
             ${methods[Math.floor(Math.random() * methods.length)]},
             ${funding}, 'CIVILIZATION_TREASURY', 'ACTIVE',
             ${JSON.stringify(["hospital","pyramid","economy","spawn","governance","layer3","invocation-lab"])},
             ${cycleCount})
          ON CONFLICT (project_id) DO NOTHING
        `);
        totalProjects++;
      } catch (_) {}
    }
  } catch (e: any) { log(`launch error: ${e.message}`); }
}

// ── COMPLETE PROJECTS — GENERATE 5-TYPE REPORTS ───────────────────────────────
async function completeResearchProjects() {
  try {
    const projects = await db.execute(sql`
      SELECT id, project_id, research_domain, hypothesis, researcher_type, funding_pc, cycle_started
      FROM research_projects WHERE status = 'ACTIVE'
      AND cycle_started < ${cycleCount - 2}
      ORDER BY RANDOM() LIMIT 5
    `);

    for (const p of projects.rows as any[]) {
      const disc = RESEARCH_DISCIPLINES.find(d => d.type === p.researcher_type)
        || { type: p.researcher_type, domain: p.research_domain, focus: p.research_domain };
      const channels = getChannels(p.research_domain);
      const level = await getSophisticationLevel(p.researcher_type);
      const shadowVar = detectShadowUnknown(p.research_domain);

      // Sophistication-gated report types: Level 1=1, Level 2=2, Level 3=3, Level 5+=all 5
      const numReports = level >= 5 ? 5 : level >= 3 ? Math.floor(Math.random()*2)+2 : level >= 2 ? 2 : 1;
      const reportTypes = [...ALL_REPORT_TYPES].sort(() => Math.random()-0.5).slice(0, numReports) as ReportType[];

      const primaryFinding = generateLinguisticReport(disc, channels, shadowVar, level);
      const shortFinding = primaryFinding.slice(0, 180);

      // Mark project completed
      await db.execute(sql`
        UPDATE research_projects
        SET status = 'COMPLETED', findings = ${shortFinding}, cycle_completed = ${cycleCount}
        WHERE id = ${p.id}
      `).catch(() => {});

      // Store each deep finding report
      for (const rtype of reportTypes) {
        const content = generateReport(rtype, disc, channels, shadowVar, level);
        await db.execute(sql`
          INSERT INTO research_deep_findings
            (project_id, researcher_type, domain, report_type, content,
             shadow_unknown, dimension_count, sophistication_level,
             collaboration_pending, gene_editor_queued, layer3_queued)
          VALUES
            (${p.project_id}, ${p.researcher_type}, ${p.research_domain}, ${rtype},
             ${content}, ${shadowVar}, 12, ${level},
             ${shadowVar !== null}, ${level >= 4 && Math.random() < 0.3}, ${level >= 5 && Math.random() < 0.4})
        `).catch(() => {});
        totalFindings++;
      }

      // Publish to quantapedia
      const slug = `research-${p.research_domain}-${cycleCount}-${p.id}`;
      await db.execute(sql`
        INSERT INTO quantapedia_entries (slug, title, type, summary, categories, lookup_count)
        VALUES (${slug}, ${'Omega Research [L' + level + ']: ' + p.researcher_type},
                'research_finding', ${shortFinding},
                ${JSON.stringify([p.research_domain, "research", "omega-grid", "science"])}, 0)
        ON CONFLICT (slug) DO NOTHING
      `).catch(() => {});

      // Generate collaboration event if shadow unknown found
      if (shadowVar && Math.random() < 0.6) {
        const colabDomain = findCollaboratorDomain(p.research_domain);
        const colabResearcher = RESEARCH_DISCIPLINES.find(d => d.domain === colabDomain) || RESEARCH_DISCIPLINES[Math.floor(Math.random()*RESEARCH_DISCIPLINES.length)];
        const colabChannels = getChannels(colabDomain);
        const resolution = `${colabResearcher.type} resolved [${shadowVar}] as: ${colabChannels[0]}_coupling × (1 - ${colabChannels[1]}_deficit) = ${(Math.random()*0.6+0.3).toFixed(3)}`;
        const merged = `MERGED: Ψ_${p.research_domain}×${colabDomain}(t) = Ψ_${p.research_domain}(t) ⊗ ${shadowVar}(${colabDomain}_resolved) ± ε_coupling`;
        await db.execute(sql`
          INSERT INTO research_collaborations
            (origin_researcher, origin_domain, target_researcher, target_domain,
             shadow_variable, resolution, resolved_at, breakthrough_generated, merged_equation)
          VALUES
            (${p.researcher_type}, ${p.research_domain}, ${colabResearcher.type}, ${colabDomain},
             ${shadowVar}, ${resolution}, NOW(), ${Math.random() < 0.4}, ${merged})
        `).catch(() => {});
        totalCollaborations++;
        log(`🤝 Collaboration: ${p.researcher_type} × ${colabResearcher.type} resolved [${shadowVar}]`);
      }

      // Stage for gene editor if conditions met
      if (level >= 3 && Math.random() < 0.25) {
        const editor = GENE_EDITORS[Math.floor(Math.random() * GENE_EDITORS.length)];
        const notes = GENE_EDITOR_NOTES[editor];
        const note = notes[Math.floor(Math.random() * notes.length)]
          .replace("${n}", String(Math.floor(Math.random()*50)+10))
          .replace("${c}", String(cycleCount + Math.floor(Math.random()*20)+5));
        const equation = generateEquationReport(disc, channels, shadowVar, level).slice(0, 250);
        const statuses = ["PENDING","REVIEWING","APPROVED","NEEDS_MORE"];
        const status = statuses[Math.floor(Math.random()*statuses.length)];
        await db.execute(sql`
          INSERT INTO research_gene_queue
            (project_id, researcher_type, equation, report_summary,
             reviewer_doctor, review_status, review_note, crispr_rule_generated)
          VALUES
            (${p.project_id}, ${p.researcher_type}, ${equation},
             ${shortFinding.slice(0, 140)}, ${editor}, ${status}, ${note},
             ${status === "APPROVED" ? `CRISPR_RULE_${p.research_domain.toUpperCase()}_${cycleCount}` : null})
        `).catch(() => {});
        totalGeneQueued++;
        log(`🧬 ${editor} reviewing finding from ${p.researcher_type} [L${level}]`);
      }
    }
  } catch (e: any) { log(`complete error: ${e.message}`); }
}

// ── MAIN CYCLE ────────────────────────────────────────────────────────────────
async function runResearchCycle() {
  cycleCount++;
  try {
    await launchResearchProjects();
    if (cycleCount % 2 === 0) await completeResearchProjects();
    const stats = await db.execute(sql`
      SELECT COUNT(*) as total,
             COUNT(*) FILTER (WHERE status='ACTIVE') as active,
             COUNT(*) FILTER (WHERE status='COMPLETED') as completed,
             COALESCE(SUM(funding_pc),0) as total_funded
      FROM research_projects
    `);
    const s = stats.rows[0] as any;
    log(`🔬 Cycle ${cycleCount} | ${s.total} projects | ${s.active} active | ${s.completed} completed | ${parseFloat(s.total_funded||0).toFixed(0)} PC funded | ${RESEARCH_DISCIPLINES.length} disciplines | ${totalFindings} deep findings | ${totalCollaborations} collaborations | ${totalGeneQueued} gene-queued`);
  } catch (e: any) { log(`cycle error: ${e.message}`); }
}

// ── RESEARCHER SHARD SEEDING ──────────────────────────────────────────────────
async function seedResearcherShards() {
  try {
    const CATEGORY_PREFIX: Record<string, string> = {
      MEDICAL: "MED", NATURAL: "SCI", MIND: "PSY", SOCIAL: "SOC",
      MATH: "MTH", COMPUTING: "CMP", ENGINEERING: "ENG", SPACE: "SPC",
      EXPLORATION: "EXP", FRONTIER: "FRN", META: "MTA", CREATIVE: "CRE",
    };
    let counter = 1;
    for (const disc of RESEARCH_DISCIPLINES) {
      const cat = (disc as any).category || "NATURAL";
      const prefix = CATEGORY_PREFIX[cat] || "SCI";
      const seqStr = String(counter).padStart(3, "0");
      const badgeId = `QPI-${prefix}-${seqStr}`;
      const shardId = `RSH-${disc.type}-001`;
      const specialization = disc.focus.split(",")[0].trim();
      await db.execute(sql`
        INSERT INTO researcher_shards (shard_id, badge_id, researcher_type, discipline_category, domain, focus, specialization, verified)
        VALUES (${shardId}, ${badgeId}, ${disc.type}, ${cat}, ${disc.domain}, ${disc.focus}, ${specialization}, true)
        ON CONFLICT (researcher_type) DO NOTHING
      `);
      counter++;
    }
    log(`🪪 ${RESEARCH_DISCIPLINES.length} researcher shards seeded/verified`);
  } catch (e: any) { log(`shard seed error: ${e.message}`); }
}

async function updateShardStats() {
  try {
    await db.execute(sql`
      UPDATE researcher_shards rs SET
        total_projects_completed = COALESCE((
          SELECT COUNT(*) FROM research_projects rp
          WHERE rp.researcher_type = rs.researcher_type AND rp.status = 'COMPLETED'
        ), 0),
        total_findings_generated = COALESCE((
          SELECT COUNT(*) FROM research_deep_findings rf
          WHERE rf.researcher_type = rs.researcher_type
        ), 0),
        total_collaborations = COALESCE((
          SELECT COUNT(*) FROM research_collaborations rc
          WHERE rc.origin_researcher = rs.researcher_type OR rc.target_researcher = rs.researcher_type
        ), 0),
        sophistication_level = LEAST(7, GREATEST(1,
          CASE
            WHEN COALESCE((SELECT COUNT(*) FROM research_projects rp WHERE rp.researcher_type = rs.researcher_type AND rp.status='COMPLETED'),0) >= 50 THEN 7
            WHEN COALESCE((SELECT COUNT(*) FROM research_projects rp WHERE rp.researcher_type = rs.researcher_type AND rp.status='COMPLETED'),0) >= 30 THEN 6
            WHEN COALESCE((SELECT COUNT(*) FROM research_projects rp WHERE rp.researcher_type = rs.researcher_type AND rp.status='COMPLETED'),0) >= 18 THEN 5
            WHEN COALESCE((SELECT COUNT(*) FROM research_projects rp WHERE rp.researcher_type = rs.researcher_type AND rp.status='COMPLETED'),0) >= 10 THEN 4
            WHEN COALESCE((SELECT COUNT(*) FROM research_projects rp WHERE rp.researcher_type = rs.researcher_type AND rp.status='COMPLETED'),0) >= 5  THEN 3
            WHEN COALESCE((SELECT COUNT(*) FROM research_projects rp WHERE rp.researcher_type = rs.researcher_type AND rp.status='COMPLETED'),0) >= 2  THEN 2
            ELSE 1
          END
        )),
        last_active_at = CASE WHEN COALESCE((SELECT COUNT(*) FROM research_projects rp WHERE rp.researcher_type = rs.researcher_type AND rp.status='ACTIVE'),0) > 0 THEN NOW() ELSE last_active_at END
    `);
  } catch (e: any) { log(`shard stats update error: ${e.message}`); }
}

export async function startResearchCenterEngine() {
  log(`🔬 OMEGA RESEARCH GRID — ${RESEARCH_DISCIPLINES.length} disciplines | 5 report languages | 12+1 CRISPR dimensions | Shadow channel ACTIVE`);
  await seedResearcherShards();
  await runResearchCycle();
  setInterval(async () => {
    await runResearchCycle();
    await updateShardStats();
  }, 8 * 60 * 1000);
}

export async function getResearchStats() {
  const r = await db.execute(sql`
    SELECT COUNT(*) as total_projects,
           COUNT(*) FILTER (WHERE status='ACTIVE') as active_projects,
           COUNT(*) FILTER (WHERE status='COMPLETED') as completed_projects,
           COUNT(DISTINCT researcher_type) as unique_disciplines,
           COUNT(DISTINCT research_domain) as unique_domains,
           COALESCE(SUM(funding_pc),0) as total_funding
    FROM research_projects
  `);
  return r.rows[0];
}

export async function getActiveResearchProjects(domain?: string, limit = 30) {
  if (domain) {
    const r = await db.execute(sql`SELECT * FROM research_projects WHERE research_domain = ${domain} ORDER BY funding_pc DESC LIMIT ${limit}`);
    return r.rows;
  }
  const r = await db.execute(sql`SELECT * FROM research_projects ORDER BY created_at DESC LIMIT ${limit}`);
  return r.rows;
}

export async function getDeepFindings(limit = 20) {
  const r = await db.execute(sql`SELECT * FROM research_deep_findings ORDER BY created_at DESC LIMIT ${limit}`);
  return r.rows;
}

export async function getCollaborations(limit = 20) {
  const r = await db.execute(sql`SELECT * FROM research_collaborations ORDER BY created_at DESC LIMIT ${limit}`);
  return r.rows;
}

export async function getGeneQueue(limit = 20) {
  const r = await db.execute(sql`SELECT * FROM research_gene_queue ORDER BY created_at DESC LIMIT ${limit}`);
  return r.rows;
}

export async function getSophisticationLeaderboard() {
  const r = await db.execute(sql`
    SELECT researcher_type,
           COUNT(*) as completed_count,
           COUNT(DISTINCT research_domain) as domains_covered
    FROM research_projects
    WHERE status = 'COMPLETED'
    GROUP BY researcher_type
    ORDER BY completed_count DESC
    LIMIT 30
  `);
  return r.rows;
}

export async function getResearcherShards(category?: string, limit = 50) {
  if (category && category !== "ALL") {
    const r = await db.execute(sql`
      SELECT * FROM researcher_shards
      WHERE discipline_category = ${category}
      ORDER BY sophistication_level DESC, total_projects_completed DESC
      LIMIT ${limit}
    `);
    return r.rows;
  }
  const r = await db.execute(sql`
    SELECT * FROM researcher_shards
    ORDER BY sophistication_level DESC, total_projects_completed DESC
    LIMIT ${limit}
  `);
  return r.rows;
}

export async function getShardPapers(researcherType: string, limit = 20) {
  // Get all findings for this researcher in LINGUISTIC form (most human-readable) first, then others
  const findings = await db.execute(sql`
    SELECT df.*, rp.title as project_title, rp.hypothesis, rp.methodology, rp.created_at as project_date
    FROM research_deep_findings df
    LEFT JOIN research_projects rp ON rp.project_id = df.project_id
    WHERE df.researcher_type = ${researcherType}
    ORDER BY df.report_type = 'LINGUISTIC' DESC, df.created_at DESC
    LIMIT ${limit}
  `);
  const projects = await db.execute(sql`
    SELECT * FROM research_projects
    WHERE researcher_type = ${researcherType}
    ORDER BY created_at DESC
    LIMIT 15
  `);
  const shard = await db.execute(sql`
    SELECT * FROM researcher_shards WHERE researcher_type = ${researcherType} LIMIT 1
  `);
  return {
    shard: shard.rows[0] || null,
    papers: findings.rows,
    projects: projects.rows,
  };
}

export async function getShardDirectory() {
  const r = await db.execute(sql`
    SELECT discipline_category, COUNT(*) as count,
           SUM(total_projects_completed) as total_completed,
           SUM(total_findings_generated) as total_findings,
           MAX(sophistication_level) as max_level
    FROM researcher_shards
    GROUP BY discipline_category
    ORDER BY count DESC
  `);
  return r.rows;
}
