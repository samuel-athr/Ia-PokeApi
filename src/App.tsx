import { useState, useEffect, useCallback } from "react";
import {
  View, Text, Image, TextInput, TouchableOpacity,
  ActivityIndicator, StyleSheet, FlatList, SafeAreaView,
} from "react-native";

interface Pokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  sprites: {
    other: { "official-artwork": { front_default: string } };
  };
}

interface PokemonListItem {
  id: number;
  name: string;
}

// Constrói a URL do sprite direto pelo ID — evita 151 chamadas à API
const spriteUrl = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

export default function Pokedex() {
  const [pokemon, setPokemon]       = useState<Pokemon | null>(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [busca, setBusca]           = useState("pikachu");
  const [inputValue, setInput]      = useState("pikachu");
  const [pokemonList, setPokemonList] = useState<PokemonListItem[]>([]);
  const [listLoading, setListLoading] = useState(true);

  // Busca detalhes do Pokémon atual
  useEffect(() => {
    const fetchPokemon = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${busca}`);
        if (!res.ok) throw new Error("Pokémon não encontrado!");
        const data: Pokemon = await res.json();
        setPokemon(data);
      } catch (err: any) {
        setError(err.message);
        setPokemon(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPokemon();
  }, [busca]);

  // Busca a lista dos 151 Pokémon uma única vez
  useEffect(() => {
    const fetchList = async () => {
      try {
        const res  = await fetch("https://pokeapi.co/api/v2/pokemon?limit=151");
        const data = await res.json();
        const list: PokemonListItem[] = data.results.map(
          (p: any, i: number) => ({ id: i + 1, name: p.name })
        );
        setPokemonList(list);
      } finally {
        setListLoading(false);
      }
    };
    fetchList();
  }, []);

  const navegar = (id: number) => {
    setBusca(String(id));
    setInput(String(id));
  };

  // Cabeçalho da FlatList — card de detalhes + barra de busca
  const Header = useCallback(() => (
    <View>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={inputValue}
          onChangeText={setInput}
          onSubmitEditing={() => navegar(Number(inputValue) || busca as any)}
          placeholder="Nome ou número..."
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={styles.btn}
          onPress={() => setBusca(inputValue.toLowerCase())}
        >
          <Text style={styles.btnText}>Buscar</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator size="large" style={{ marginVertical: 32 }} />}
      {error   && <Text style={styles.erro}>{error}</Text>}

      {pokemon && !loading && (
        <View style={styles.card}>
          <Text style={styles.pokemonNum}>
            #{String(pokemon.id).padStart(3, "0")}
          </Text>
          <Image
            source={{ uri: pokemon.sprites.other["official-artwork"].front_default }}
            style={styles.imagem}
          />
          <Text style={styles.nome}>{pokemon.name}</Text>
          <Text style={styles.detalhe}>
            Altura: {(pokemon.height / 10).toFixed(1)} m · Peso: {(pokemon.weight / 10).toFixed(1)} kg
          </Text>

          <View style={styles.wrapTransform}>
            <TouchableOpacity
              style={[styles.btnTransform, pokemon.id <= 1 && styles.btnDisabled]}
              onPress={() => navegar(pokemon.id - 1)}
              disabled={pokemon.id <= 1}
            >
              <Text style={styles.btnText}>← Anterior</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnTransform}
              onPress={() => navegar(pokemon.id + 1)}
            >
              <Text style={styles.btnText}>Próximo →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Todos os Pokémon</Text>
    </View>
  ), [pokemon, loading, error, inputValue, busca]);

  const renderItem = ({ item }: { item: PokemonListItem }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => navegar(item.id)}
    >
      <Image source={{ uri: spriteUrl(item.id) }} style={styles.listSprite} />
      <Text style={styles.listNum}>#{String(item.id).padStart(3, "0")}</Text>
      <Text style={styles.listName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={pokemonList}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        numColumns={3}
        ListHeaderComponent={Header}
        ListFooterComponent={
          listLoading
            ? <ActivityIndicator style={{ margin: 16 }} />
            : null
        }
        contentContainerStyle={styles.container}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: "#fff" },
  container:    { padding: 16, paddingTop: 30 },
  row:          { flexDirection: "row", gap: 8, marginBottom: 16 },
  input: {
    flex: 1, borderWidth: 1, borderColor: "#ccc",
    borderRadius: 8, paddingHorizontal: 12, height: 44,
  },
  btn: {
    backgroundColor: "#3B82F6", borderRadius: 8,
    paddingHorizontal: 16, justifyContent: "center",
  },
  btnText:      { color: "#fff", fontWeight: "500" },
  erro:         { color: "red", marginTop: 16, textAlign: "center" },
  card: {
    alignItems: "center", marginBottom: 24, padding: 20,
    borderRadius: 16, backgroundColor: "#f8f8f8",
    borderWidth: 0.5, borderColor: "#e5e5e5",
  },
  pokemonNum:   { fontSize: 13, color: "#aaa", marginBottom: 4 },
  imagem:       { width: 160, height: 160 },
  nome: {
    fontSize: 22, fontWeight: "600",
    textTransform: "capitalize", marginTop: 8,
  },
  detalhe:      { fontSize: 14, color: "#666", marginTop: 4 },
  wrapTransform:{ flexDirection: "row", gap: 10, marginTop: 14 },
  btnTransform: {
    backgroundColor: "#3B82F6", borderRadius: 8,
    paddingVertical: 8, paddingHorizontal: 16,
  },
  btnDisabled:  { backgroundColor: "#ccc" },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  listItem: {
    flex: 1, alignItems: "center", padding: 8, margin: 2,
    borderRadius: 8, backgroundColor: "#f8f8f8",
    borderWidth: 0.5, borderColor: "#e5e5e5",
  },
  listSprite:   { width: 64, height: 64 },
  listNum:      { fontSize: 10, color: "#aaa", marginTop: 2 },
  listName: {
    fontSize: 11, textTransform: "capitalize",
    textAlign: "center", marginTop: 1,
  },
});