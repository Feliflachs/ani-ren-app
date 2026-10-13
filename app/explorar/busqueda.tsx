import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { Screen, Chips, SearchBar, PublicationCard, ListCard } from '../../src/components';
import { useDebounce, usePage } from '../../src/remote';
import { query } from '../../src/api';
import { AnimeRow, Field, PageEnd, UserRow, ui } from '../../src/remote-ui';
import type { Anime, AnimeList, Publication, User } from '../../src/models';
const types: Record<string, string> = {
  Animes: 'anime',
  Usuarios: 'users',
  Publicaciones: 'publications',
  Listas: 'lists',
};
const seasons: Record<string, string> = {
  Todas: '',
  Primavera: 'spring',
  Verano: 'summer',
  Otoño: 'fall',
  Invierno: 'winter',
};
export default function Busqueda() {
  const params = useLocalSearchParams<{
    q?: string;
    type?: string;
    genre?: string;
    season?: string;
  }>();
  const [category, setCategory] = useState(
    params.type && types[params.type] ? params.type : 'Animes',
  );
  const [value, setValue] = useState(params.q ?? '');
  const [year, setYear] = useState('');
  const [genre, setGenre] = useState(params.genre ?? '');
  const [season, setSeason] = useState(params.season ?? 'Todas');
  const q = useDebounce(value.trim());
  const debouncedYear = useDebounce(year);
  const type = types[category];
  const local = type === 'publications' || type === 'lists';
  const page = usePage<Anime | User | Publication | AnimeList>(
    type === 'anime' && q.length < 2
      ? null
      : query('/search', {
          type,
          q,
          year: local ? debouncedYear : '',
          genres: local ? genre : '',
          season: local ? seasons[season] : '',
        }),
    type === 'anime',
  );
  return (
    <Screen title="Buscar" back>
      <SearchBar value={value} onChangeText={setValue} />
      <Chips options={Object.keys(types)} value={category} onChange={setCategory} />
      {local && (
        <View style={{ gap: 10 }}>
          <Chips options={Object.keys(seasons)} value={season} onChange={setSeason} />
          <Chips
            options={[
              'Todos los géneros',
              'Acción',
              'Comedia',
              'Fantasía',
              'Romance',
              'Aventura',
              'Drama',
              'Deportes',
            ]}
            value={
              (
                {
                  'mal:1': 'Acción',
                  'mal:4': 'Comedia',
                  'mal:10': 'Fantasía',
                  'mal:22': 'Romance',
                  'mal:2': 'Aventura',
                  'mal:8': 'Drama',
                  'mal:30': 'Deportes',
                } as Record<string, string>
              )[genre] ?? 'Todos los géneros'
            }
            onChange={(label) =>
              setGenre(
                (
                  {
                    Acción: 'mal:1',
                    Comedia: 'mal:4',
                    Fantasía: 'mal:10',
                    Romance: 'mal:22',
                    Aventura: 'mal:2',
                    Drama: 'mal:8',
                    Deportes: 'mal:30',
                  } as Record<string, string>
                )[label] ?? '',
              )
            }
          />
          <Field label="Año (opcional)" value={year} onChange={setYear} maxLength={4} />
        </View>
      )}
      {page.data?.total !== undefined && <Text style={ui.muted}>{page.data.total} resultados</Text>}
      {type === 'anime' && q.length < 2 ? (
        <Text style={ui.muted}>Escribí al menos 2 letras para buscar un anime.</Text>
      ) : (
        <>
          {page.items.map((item) =>
            type === 'anime' ? (
              <AnimeRow key={item.id} anime={item as Anime} />
            ) : type === 'users' ? (
              <UserRow key={item.id} user={item as User} />
            ) : type === 'lists' ? (
              <ListCard key={item.id} list={item as AnimeList} />
            ) : (
              <PublicationCard key={item.id} review={item as Publication} />
            ),
          )}
          <PageEnd page={page} />
        </>
      )}
    </Screen>
  );
}
